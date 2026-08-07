// services/salesReportUtils.ts
import { Query } from "react-native-appwrite";
import { databases } from "./appwrite";
import { getProducts } from "./productsCache";

const DATABASE_ID = "6a694ca9001b95d71b14";
const SALE_COLLECTION_ID = "sales";
const PRODUCTS_COLLECTION_ID = "products";
const LOGS_COLLECTION_ID = "inventory_logs";

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
    startDate.setHours(0, 0, 0, 0);
  } else if (period === "month") {
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

    const breakdownStartDate = new Date();
    if (period === "week") {
      breakdownStartDate.setDate(breakdownStartDate.getDate() - 6);
      breakdownStartDate.setHours(0, 0, 0, 0);
    } else {
      breakdownStartDate.setDate(breakdownStartDate.getDate() - 30);
      breakdownStartDate.setHours(0, 0, 0, 0);
    }

    const [salesRes, productsRes, logsRes] = await Promise.all([
      databases.listDocuments(DATABASE_ID, SALE_COLLECTION_ID, [
        Query.greaterThanEqual("$createdAt", breakdownStartDate.toISOString()),
        Query.lessThanEqual("$createdAt", endDate),
        Query.orderDesc("$createdAt"),
        Query.limit(500),
      ]),
      getProducts(databases),
      databases.listDocuments(DATABASE_ID, LOGS_COLLECTION_ID, [
        Query.greaterThanEqual("$createdAt", breakdownStartDate.toISOString()),
        Query.lessThanEqual("$createdAt", endDate),
        Query.equal("action_type", "Sale"),
        Query.limit(500),
      ]),
    ]);

    // 1. Map Base Unit Costs (cost / conversion_factor)
    const baseUnitCostMap: Record<string, number> = {};
    (productsRes || []).forEach((doc: any) => {
      const packageCost = Number(doc.cost || doc.unit_cost || 0);
      const conversionRate = Number(doc.conversion_factor) || 1;
      baseUnitCostMap[doc.$id] = packageCost / conversionRate;
    });

    // 2. Sum actual log deductions per sale date
    const dailyCogsMap: Record<string, number> = {};
    let periodTotalCOGS = 0;
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    logsRes.documents.forEach((log: any) => {
      const pId = typeof log.products_id === "object" ? log.products_id?.$id : log.products_id;
      const baseUnitsUsed = Math.abs(Number(log.quantity_changed || 0));
      const baseCost = baseUnitCostMap[pId] || 0;
      const logCogs = baseUnitsUsed * baseCost;

      const logDate = new Date(log.$createdAt);
      let dateKey = "";
      if (period === "week") {
        dateKey = logDate.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
      } else {
        const dayOfMonth = logDate.getDate();
        const weekNum = Math.ceil(dayOfMonth / 7);
        dateKey = `Week ${weekNum}`;
      }

      dailyCogsMap[dateKey] = (dailyCogsMap[dateKey] || 0) + logCogs;

      // Filter COGS for active period
      if (period === "week") {
        if (logDate >= todayMidnight) {
          periodTotalCOGS += logCogs;
        }
      } else {
        periodTotalCOGS += logCogs;
      }
    });

    const salesDocs = salesRes.documents;
    let grossRevenue = 0;
    let totalOrders = 0;
    const breakdownMap: Record<string, { revenue: number }> = {};

    salesDocs.forEach((sale: any) => {
      const saleDate = new Date(sale.$createdAt);
      const saleTotal = Number(sale.total_price || sale.total || 0);

      if (period === "week") {
        if (saleDate >= todayMidnight) {
          grossRevenue += saleTotal;
          totalOrders += 1;
        }
      } else {
        grossRevenue += saleTotal;
        totalOrders += 1;
      }

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
        breakdownMap[bucketLabel] = { revenue: 0 };
      }

      breakdownMap[bucketLabel].revenue += saleTotal;
    });

    const netProfit = grossRevenue - periodTotalCOGS;
    const profitMarginPercent = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

    const breakdown: ProfitBreakdownItem[] = Object.keys(breakdownMap).map((label) => {
      const rev = breakdownMap[label].revenue;
      const cogs = dailyCogsMap[label] || 0;
      return {
        label,
        netProfit: rev - cogs,
      };
    });

    return {
      grossRevenue,
      totalCOGS: periodTotalCOGS,
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