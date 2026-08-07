import { Query } from "react-native-appwrite";
import { databases } from "./appwrite";
import { getProducts } from "./productsCache";

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
  continuingStock: number;
  conversionFactor: number;
}

export type TimeframePeriod = "week" | "month";

/**
 * Calculates start and end ISO dates for a given timeframe period
 */
export const getPeriodDates = (period: TimeframePeriod) => {
  const now = new Date();
  const startDate = new Date();

  if (period === "week") {
    startDate.setDate(now.getDate() - 7);
  } else if (period === "month") {
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

    // 1. Fetch all products (cached)
    const productsRes = await getProducts(databases);

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

    // 3. Explicitly type reportMap with restockedPackages & baseUnitsUsed
    const reportMap: Record<
      string,
      { restockedPackages: number; baseUnitsUsed: number }
    > = {};

    logsRes.documents.forEach((log: any) => {
      const pId =
        typeof log.products_id === "object"
          ? log.products_id?.$id
          : log.products_id;

      if (!pId) return;

      if (!reportMap[pId]) {
        reportMap[pId] = { restockedPackages: 0, baseUnitsUsed: 0 };
      }

      const qty = Math.abs(Number(log.quantity_changed || log.qty_changed || 0));
      const action = (log.action_type || log.type || "").toLowerCase();

      if (action === "restock") {
        reportMap[pId].restockedPackages += qty;
      } else if (action === "sale" || action === "deduction" || action === "waste") {
        reportMap[pId].baseUnitsUsed += qty;
      }
    });

    // 4. Combine aggregated stats with registered products list
    return (productsRes || []).map((pDoc: any): InventoryReportItem => {
      const stats = reportMap[pDoc.$id] || { restockedPackages: 0, baseUnitsUsed: 0 };
      const factor = Number(pDoc.conversion_factor) || 1;

      return {
        productId: pDoc.$id,
        productName: pDoc.product_name,
        unit: pDoc.unit || "unit",
        restockUnit: pDoc.restock_unit || pDoc.unit || "unit",
        totalRestocked: stats.restockedPackages,
        totalUsed: stats.baseUnitsUsed,
        currentStock: Number(pDoc.quantity || 0),
        continuingStock: Number(pDoc.continuing_stock || 0),
        conversionFactor: factor,
      };
    });
  } catch (error) {
    console.error("Error generating inventory report:", error);
    return [];
  }
};