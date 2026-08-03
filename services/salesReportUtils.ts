// services/salesReportUtils.ts
import { Query } from "react-native-appwrite";
import { databases } from "./appwrite";

const DATABASE_ID = "6a694ca9001b95d71b14";
const SALE_COLLECTION_ID = "sales";
const PRODUCTS_COLLECTION_ID = "products";

export type TimeframePeriod = "week" | "month";

export interface ProfitBreakdownItem {
  label: string; // e.g. "Mon, Aug 3" or "Week 1"
  netProfit: number;
}

export interface SalesReportSummary {
  grossRevenue: number;
  totalCOGS: number;
  netProfit: number;
  profitMarginPercent: number;
  totalOrders: number;
  breakdown: ProfitBreakdownItem[]; // Daily or Weekly Net Profit list
}

export const getSalesReportDates = (period: TimeframePeriod) => {
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

export const fetchSalesReport = async (
  period: TimeframePeriod = "month"
): Promise<SalesReportSummary> => {
  try {
    const { startDate, endDate } = getSalesReportDates(period);

    const [salesRes, productsRes] = await Promise.all([
      databases.listDocuments(DATABASE_ID, SALE_COLLECTION_ID, [
        Query.greaterThanEqual("$createdAt", startDate),
        Query.lessThanEqual("$createdAt", endDate),
        Query.orderDesc("$createdAt"),
        Query.limit(500),
      ]),
      databases.listDocuments(DATABASE_ID, PRODUCTS_COLLECTION_ID),
    ]);

    // Map product IDs to base unit cost
    const baseUnitCostMap: Record<string, number> = {};
    productsRes.documents.forEach((doc: any) => {
      const packageCost = Number(doc.unit_cost || 0);
      const conversionRate = Number(doc.conversion_factor) || 1;
      baseUnitCostMap[doc.$id] = packageCost / conversionRate;
    });

    const salesDocs = salesRes.documents;
    const totalOrders = salesDocs.length;

    let grossRevenue = 0;
    let totalCOGS = 0;

    // Map for aggregating daily/weekly breakdowns
    const breakdownMap: Record<string, { revenue: number; cogs: number }> = {};

    salesDocs.forEach((sale: any) => {
      const saleTotal = Number(sale.total_price || sale.total || 0);
      grossRevenue += saleTotal;

      let saleCOGS = 0;

      if (Array.isArray(sale.items)) {
        sale.items.forEach((item: any) => {
          const pId = item.productId || item.product_id;
          const costPerUnit = baseUnitCostMap[pId] || 0;
          const qtyUsed = Number(item.qty || item.quantity || 1);
          saleCOGS += costPerUnit * qtyUsed;
        });
      } else if (sale.cogs && Number(sale.cogs) > 0) {
        saleCOGS += Number(sale.cogs);
      }

      // Fallback estimate (~35% COGS) if ingredient costs aren't attached directly
      if (saleCOGS === 0 && saleTotal > 0) {
        saleCOGS = saleTotal * 0.35;
      }

      totalCOGS += saleCOGS;

      // Group into breakdown buckets
      const saleDate = new Date(sale.$createdAt);
      let bucketLabel = "";

      if (period === "week") {
        // Group by Day (e.g. "Mon, Aug 3")
        bucketLabel = saleDate.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
      } else {
        // Group by Week (e.g. "Week 1", "Week 2")
        const dayOfMonth = saleDate.getDate();
        const weekNum = Math.ceil(dayOfMonth / 7);
        bucketLabel = `Week ${weekNum}`;
      }

      if (!breakdownMap[bucketLabel]) {
        breakdownMap[bucketLabel] = { revenue: 0, cogs: 0 };
      }

      breakdownMap[bucketLabel].revenue += saleTotal;
      breakdownMap[bucketLabel].cogs += saleCOGS;
    });

    const netProfit = grossRevenue - totalCOGS;
    const profitMarginPercent = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

    // Convert breakdown map into formatted array
    const breakdown: ProfitBreakdownItem[] = Object.keys(breakdownMap).map((label) => {
      const item = breakdownMap[label];
      return {
        label,
        netProfit: item.revenue - item.cogs,
      };
    });

    return {
      grossRevenue,
      totalCOGS,
      netProfit,
      profitMarginPercent,
      totalOrders,
      breakdown,
    };
  } catch (error) {
    console.error("Error generating sales report:", error);
    return {
      grossRevenue: 0,
      totalCOGS: 0,
      netProfit: 0,
      profitMarginPercent: 0,
      totalOrders: 0,
      breakdown: [],
    };
  }
};