import { Query } from "react-native-appwrite";
import { databases } from "./appwrite";

const DATABASE_ID = "6a694ca9001b95d71b14";
const PRODUCTS_COLLECTION_ID = "products";
const LOGS_COLLECTION_ID = "inventory_logs";

export interface InventoryReportItem {
  productId: string;
  productName: string;
  unit: string;
  restockUnit: string;
  totalRestocked: number;
  totalUsed: number;
  currentStock: number;
}

export type TimeframePeriod = "week" | "month";

/**
 * Calculates start and end ISO dates for a given timeframe period
 */
export const getPeriodDates = (period: TimeframePeriod) => {
  const now = new Date();
  const startDate = new Date();

  if (period === "week") {
    // Start of current week (7 days ago)
    startDate.setDate(now.getDate() - 7);
  } else if (period === "month") {
    // Start of current month (1st of this month at 00:00:00)
   startDate.setDate(now.getDate() - 30);
  }

  return {
    startDate: startDate.toISOString(),
    endDate: now.toISOString(),
  };
};

/**
 * Fetches and aggregates total restocked and total used inventory per product
 */
export const fetchInventoryReport = async (
  period: TimeframePeriod = "month"
): Promise<InventoryReportItem[]> => {
  try {
    const { startDate, endDate } = getPeriodDates(period);

    // 1. Fetch all products
    const productsRes = await databases.listDocuments(
      DATABASE_ID,
      PRODUCTS_COLLECTION_ID
    );

    // 2. Fetch all inventory logs recorded within the timeframe
    const logsRes = await databases.listDocuments(
      DATABASE_ID,
      LOGS_COLLECTION_ID,
      [
        Query.greaterThanEqual("$createdAt", startDate),
        Query.lessThanEqual("$createdAt", endDate),
        Query.limit(500),
      ]
    );

    // 3. Aggregate restocks and usage per product ID
    const reportMap: Record<string, { restocked: number; used: number }> = {};

    logsRes.documents.forEach((log: any) => {
      // Get target product ID (handles both nested relation objects or raw ID strings)
      const pId =
        typeof log.products_id === "object"
          ? log.products_id?.$id
          : log.products_id;

      if (!pId) return;

      if (!reportMap[pId]) {
        reportMap[pId] = { restocked: 0, used: 0 };
      }

      const qty = Math.abs(Number(log.quantity_changed || log.qty_changed || 0));
      const action = (log.action_type || log.type || "").toLowerCase();

      if (action === "restock") {
        reportMap[pId].restocked += qty;
      } else if (action === "sale" || action === "deduction" || action === "waste") {
        reportMap[pId].used += qty;
      }
    });

    // 4. Combine aggregated stats with registered products list
    return productsRes.documents.map((pDoc: any) => {
      const stats = reportMap[pDoc.$id] || { restocked: 0, used: 0 };
      return {
        productId: pDoc.$id,
        productName: pDoc.product_name,
        unit: pDoc.unit || "unit",
        restockUnit: pDoc.restock_unit || pDoc.unit || "unit",
        totalRestocked: stats.restocked,
        totalUsed: stats.used,
        currentStock: Number(pDoc.quantity || 0),
      };
    });
  } catch (error) {
    console.error("Error generating inventory report:", error);
    return [];
  }
};