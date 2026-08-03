// services/activityUtils.ts
import { Query } from "react-native-appwrite";
import { databases } from "./appwrite";

const DATABASE_ID = "6a694ca9001b95d71b14";
const SALE_COLLECTION_ID = "sales";
const PRODUCTS_COLLECTION_ID = "products";
const LOGS_COLLECTION_ID = "inventory_logs";
const PROFILES_COLLECTION_ID = "profiles"; // Ensure this matches your Appwrite profiles collection ID

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
  const date = new Date(isoString);
  return date
    .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    .replace(" ", "");
};

/**
 * Resolves staff name whether profiles_id is a populated object,
 * a raw document ID string, or a direct string property.
 */
const resolveStaffName = async (doc: any): Promise<string> => {
  // 1. Direct name string fields on the document
  if (doc.staff_name) return doc.staff_name;
  if (doc.username) return doc.username;

  const profileRef = doc.profiles_id || doc.profile_id;

  // 2. Already populated as a Relationship Object
  if (typeof profileRef === "object" && profileRef !== null) {
    return profileRef.name || profileRef.username || "Kate";
  }

  // 3. Raw String ID -> Fetch Profile Document from Appwrite
  if (typeof profileRef === "string" && profileRef.trim() !== "") {
    try {
      const pDoc: any = await databases.getDocument(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        profileRef
      );
      if (pDoc.name) return pDoc.name;
      if (pDoc.username) return pDoc.username;
    } catch (e) {
      console.warn("Could not fetch profile document for ID:", profileRef);
    }
  }

  return "Kate";
};

export const fetchCombinedActivities = async (options?: {
  limit?: number;
  todayOnly?: boolean;
}): Promise<CombinedActivityLog[]> => {
  try {
    const queries: string[] = [Query.orderDesc("$createdAt")];

    if (options?.limit) {
      queries.push(Query.limit(options.limit));
    }

    if (options?.todayOnly) {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      queries.push(Query.greaterThanEqual("$createdAt", startOfToday.toISOString()));
    }

    // Parallel calls to sales and inventory logs
    const [salesRes, logsRes] = await Promise.all([
      databases.listDocuments(DATABASE_ID, SALE_COLLECTION_ID, queries),
      databases.listDocuments(DATABASE_ID, LOGS_COLLECTION_ID, queries),
    ]);

    // 1. Format Sales entries using resolveStaffName
    const formattedSales: CombinedActivityLog[] = await Promise.all(
      salesRes.documents.map(async (doc: any) => {
        const staffName = await resolveStaffName(doc); // 👈 Async lookup fix
        return {
          id: doc.$id,
          type: "sale",
          title: `${staffName} Sold ${doc.items_summary || "Items"}`,
          time: formatActivityTime(doc.$createdAt),
          rawDate: doc.$createdAt,
          icon: "🛒",
          category: doc.category,
        };
      })
    );

    // 2. Format Restock entries (filtering out raw ingredient deductions)
    const restockLogs = logsRes.documents.filter((doc: any) => {
      const action = (doc.action_type || doc.type || "").toLowerCase();
      const note = (doc.note || doc.title || "").toLowerCase();

      // Skip background recipe deductions
      if (note.includes("staff sale") || action === "deduction" || action === "recipe_deduct") {
        return false;
      }
      return action === "restock" || action === "sale";
    });

    const formattedLogs: CombinedActivityLog[] = await Promise.all(
      restockLogs.map(async (log: any) => {
        let prodName = log.product_name || "Item";
        let itemCategory = log.category;

        // If product details aren't populated, fetch product directly
        if (typeof log.products_id === "string" && log.products_id) {
          try {
            const pDoc: any = await databases.getDocument(
              DATABASE_ID,
              PRODUCTS_COLLECTION_ID,
              log.products_id
            );
            prodName = pDoc.product_name || prodName;
            itemCategory = pDoc.category || itemCategory;
          } catch (e) {
            console.error("Could not fetch product for log:", log.products_id);
          }
        } else if (typeof log.products_id === "object" && log.products_id) {
          prodName = log.products_id.product_name || prodName;
          itemCategory = log.products_id.category || itemCategory;
        }

        const staffName = await resolveStaffName(log); // 👈 Async lookup fix
        const qtyAdded = log.quantity_changed || log.qty_added || log.qty_changed || 0;

        return {
          id: log.$id,
          type: "inventory",
          title: `${staffName} Restocked ${prodName} +${qtyAdded}`,
          time: formatActivityTime(log.restocked_at || log.$createdAt),
          rawDate: log.$createdAt,
          icon: "🧺",
          category: itemCategory,
        };
      })
    );

    // Merge and sort newest first
    return [...formattedSales, ...formattedLogs].sort(
      (a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime()
    );
  } catch (error) {
    console.error("Error fetching combined activities:", error);
    return [];
  }
};