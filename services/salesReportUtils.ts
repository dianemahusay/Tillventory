// services/salesReportUtils.ts
import { Query } from "react-native-appwrite";
import { databases } from "./appwrite";

const DATABASE_ID = "6a694ca9001b95d71b14";
const SALE_COLLECTION_ID = "sales";
const PRODUCTS_COLLECTION_ID = "products";

export type TimeframePeriod = "week" | "month";

export interface ProfitBreakdownItem {
  label: string;
  netProfit: number;
}

export interface SalesReportSummary {
  grossRevenue: number;
  totalCOGS: number;
  netProfit: number;
  profitMarginPercent: number;
  totalOrders: number;
  breakdown: ProfitBreakdownItem[];
}

export const getSalesReportDates = (period: TimeframePeriod) => {
  const now = new Date();
  const startDate = new Date();

  if (period === "week") {
    // 💡 DAILY MODE: Start strictly at Midnight TODAY (00:00:00)
    // This accumulates today's sales continuously and resets at 12:00 AM midnight.
    startDate.setHours(0, 0, 0, 0);
  } else if (period === "month") {
    // 💡 MONTHLY MODE: Look back across the past 30 days
    startDate.setDate(now.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);
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

    // If in Weekly (Daily) mode, fetch the last 7 days of sales for the "Net Profit per Day" breakdown list
    // but filter today's top cards strictly for today's continuous totals!
    const breakdownStartDate = new Date();
    if (period === "week") {
      breakdownStartDate.setDate(breakdownStartDate.getDate() - 6);
      breakdownStartDate.setHours(0, 0, 0, 0);
    } else {
      breakdownStartDate.setDate(breakdownStartDate.getDate() - 30);
      breakdownStartDate.setHours(0, 0, 0, 0);
    }

    const [salesRes, productsRes] = await Promise.all([
      databases.listDocuments(DATABASE_ID, SALE_COLLECTION_ID, [
        Query.greaterThanEqual("$createdAt", breakdownStartDate.toISOString()),
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

    let grossRevenue = 0;
    let totalCOGS = 0;
    let totalOrders = 0;

    const breakdownMap: Record<string, { revenue: number; cogs: number }> = {};
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    salesDocs.forEach((sale: any) => {
      const saleDate = new Date(sale.$createdAt);
      const saleTotal = Number(sale.total_price || sale.total || 0);

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

      if (saleCOGS === 0 && saleTotal > 0) {
        saleCOGS = saleTotal * 0.35;
      }

      // 1. TOP CARDS CALCULATION:
      // If Weekly toggle is selected, ONLY sum transactions created TODAY (>= todayMidnight)
      if (period === "week") {
        if (saleDate >= todayMidnight) {
          grossRevenue += saleTotal;
          totalCOGS += saleCOGS;
          totalOrders += 1;
        }
      } else {
        // Monthly view sums all past 30 days
        grossRevenue += saleTotal;
        totalCOGS += saleCOGS;
        totalOrders += 1;
      }

      // 2. BREAKDOWN LIST CALCULATION:
      let bucketLabel = "";
      if (period === "week") {
        bucketLabel = saleDate.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
      } else {
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