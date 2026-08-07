import { Query } from "react-native-appwrite";
import { databases } from "./appwrite";
import { getProducts } from "./productsCache";

const DATABASE_ID = "6a694ca9001b95d71b14";
const SALE_COLLECTION_ID = "sales";
const PRODUCTS_COLLECTION_ID = "products";
const LOGS_COLLECTION_ID = "inventory_logs";
const PROFILES_COLLECTION_ID = "profiles";

export interface CombinedActivityLog {
  id: string;
  type: "sale" | "inventory";
  title: string;
  time: string;
  rawDate: string;
  icon: string;
  category?: "Drinks" | "Foods";
}

// Format 12-hour local time (e.g., "4:09PM")
export const formatActivityTime = (isoString?: string): string => {
  if (!isoString) return "";
  return new Date(isoString)
    .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    .replace(/\s+/g, "");
};

// Helper: Extracts first valid name string from an object
const extractName = (obj: any): string | null => {
  if (!obj || typeof obj !== "object") return null;
  const name = obj.staff_name || obj.profile_name || obj.name || obj.username || obj.user_name;
  return name ? String(name).trim() : null;
};

const resolveStaffName = (doc: any, profilesMap: Map<string, any>): string => {
  // 1. Direct string property check on doc (e.g. doc.profile_name or doc.staff_name)
  const directName = extractName(doc);
  if (directName && directName.toLowerCase() !== "unknown") return directName;

  // 2. Resolve via linked profiles_id (Object OR String ID lookup in profilesMap)
  const profileRef = doc.profiles_id || doc.profile_id;
  
  if (typeof profileRef === "object" && profileRef !== null) {
    const nestedName = extractName(profileRef);
    if (nestedName && nestedName.toLowerCase() !== "unknown") return nestedName;
  } 
  
  if (typeof profileRef === "string" && profilesMap.has(profileRef)) {
    const cachedProfile = profilesMap.get(profileRef);
    const cachedName = extractName(cachedProfile);
    if (cachedName && cachedName.toLowerCase() !== "unknown") return cachedName;
  }

  // 3. Fallback to Note regex ONLY if it doesn't start with "Unknown"
  const noteText = typeof doc.note === "string" ? doc.note.trim() : "";
  if (!noteText.toLowerCase().startsWith("unknown")) {
    const noteNameMatch = noteText.match(/^(?:by\s+)?([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'-]{1,40})\s*(?:[:|]|—)/i);
    if (noteNameMatch) return noteNameMatch[1].trim();
  }

  return "Unknown";
};

export const fetchCombinedActivities = async (options?: {
  limit?: number;
  todayOnly?: boolean;
}): Promise<CombinedActivityLog[]> => {
  try {
    const queries: string[] = [Query.orderDesc("$createdAt")];

    if (options?.limit) queries.push(Query.limit(options.limit));

    if (options?.todayOnly) {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      queries.push(Query.greaterThanEqual("$createdAt", startOfToday.toISOString()));
    }

    // 🚀 Parallel execution: Fetch Sales, Inventory Logs, Products, and Profiles all at once
    const [salesRes, logsRes, productsList, profilesRes] = await Promise.all([
      databases.listDocuments(DATABASE_ID, SALE_COLLECTION_ID, queries),
      databases.listDocuments(DATABASE_ID, LOGS_COLLECTION_ID, queries),
      getProducts(databases),
      databases.listDocuments(DATABASE_ID, PROFILES_COLLECTION_ID).catch(() => ({ documents: [] })),
    ]);

    // Create fast lookup maps for profiles and products
    const profilesMap = new Map<string, any>(profilesRes.documents.map((p: any) => [p.$id, p]));
    const productsMap = new Map<string, any>((productsList || []).map((p: any) => [p.$id, p]));

    // 1. Format Sales Entries
    const formattedSales: CombinedActivityLog[] = salesRes.documents.map((doc: any) => {
      const staffName = resolveStaffName(doc, profilesMap);
      return {
        id: doc.$id,
        type: "sale",
        title: `${staffName} Sold ${doc.items_summary || "Items"}`,
        time: formatActivityTime(doc.$createdAt),
        rawDate: doc.$createdAt,
        icon: "🛒",
        category: doc.category,
      };
    });

    // 2. Filter and Format Restock Entries
    const restockLogs = logsRes.documents.filter((doc: any) => {
      const action = (doc.action_type || doc.type || "").toLowerCase();
      const note = (doc.note || "").toLowerCase();
      const qtyChanged = Number(doc.quantity_changed || doc.qty_added || 0);

      const isDeduction = note.includes("sale") || ["deduction", "recipe_deduct", "sale"].includes(action);
      return !isDeduction && action === "restock" && qtyChanged > 0;
    });

    const formattedLogs: CombinedActivityLog[] = restockLogs.map((log: any) => {
      const staffName = resolveStaffName(log, profilesMap);

      let prodName = log.product_name || "Item";
      const productId = typeof log.products_id === "object" ? log.products_id?.$id : log.products_id;
      if (productId && productsMap.has(productId)) {
        prodName = productsMap.get(productId)?.product_name || prodName;
      }

     
      const qtyAdded = log.quantity_changed || log.qty_added || 0;

      return {
        id: log.$id,
        type: "inventory",
        title: `${staffName} Restocked ${prodName} +${qtyAdded}`,
        time: formatActivityTime(log.restocked_at || log.$createdAt),
        rawDate: log.$createdAt,
        icon: "🧺",
        category: log.category,
      };
    });

    // Merge and sort newest first
    return [...formattedSales, ...formattedLogs].sort(
      (a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime()
    );
  } catch (error) {
    console.error("Error fetching combined activities:", error);
    return [];
  }
};