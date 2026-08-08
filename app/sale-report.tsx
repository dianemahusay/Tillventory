import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import {
  fetchSalesReport,
  SalesReportSummary,
  TimeframePeriod,
} from "../services/salesReportUtils";

export default function SalesReportScreen() {
  const [period, setPeriod] = useState<TimeframePeriod>("month");
  const [report, setReport] = useState<SalesReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    loadSalesReport();
  }, [period]);

  const loadSalesReport = async () => {
    setIsLoading(true);
    const data = await fetchSalesReport(period);
    setReport(data);
    setIsLoading(false);
    setRefreshing(false);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadSalesReport();
  }, [period]);

  const formatPHP = (amount: number) => {
    return `₱${amount.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <View style={{ flex: 1 }} className="bg-background pt-16">
      {/* Header */}
      <View className="px-6 mb-4">
        <Text className="text-4xl text-textPrimary font-heading pb-2 border-b border-neutral-400 mt-4">
          Tillventory
        </Text>
      </View>

      {/* Title & Period Toggle Selector */}
      <View className="px-6 mb-6 flex-row justify-between items-center">
        <Text className="text-xl font-bodyBold text-neutral-900">Financial Performance</Text>

        <View className="flex-row bg-neutral-200 rounded-xl p-1">
          <TouchableOpacity
            onPress={() => setPeriod("week")}
            className={`px-3 py-1.5 rounded-lg ${
              period === "week" ? "bg-neutral-900" : "bg-transparent"
            }`}
          >
            <Text
              className={`text-xs font-bodyBold ${
                period === "week" ? "text-white" : "text-neutral-700"
              }`}
            >
              Weekly
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPeriod("month")}
            className={`px-3 py-1.5 rounded-lg ${
              period === "month" ? "bg-neutral-900" : "bg-transparent"
            }`}
          >
            <Text
              className={`text-xs font-bodyBold ${
                period === "month" ? "text-white" : "text-neutral-700"
              }`}
            >
              Monthly
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Financial Report Content */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }}
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {isLoading ? (
          <ActivityIndicator color="#171717" size="large" className="py-10" />
        ) : (
          <View className="gap-y-4">
            {/* Total Revenue Panel */}
            <View className="bg-neutral-900 p-5 rounded-2xl shadow-sm">
              <Text className="text-xs font-bodyBold text-neutral-400 uppercase tracking-wider mb-1">
                Gross Revenue ({period === "week" ? "Past 7 Days" : "Past 30 Days"})
              </Text>
              <Text className="text-3xl font-extrabold text-white">
                {formatPHP(report?.grossRevenue || 0)}
              </Text>
            </View>

            {/* Net Profit Panel */}
            <View className="bg-green-50 border border-green-200 p-5 rounded-2xl shadow-sm">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-xs font-bodyBold text-green-800 uppercase tracking-wider">
                  Net Profit
                </Text>
                <Text className="text-xs font-bodyBold text-green-700 bg-green-200/60 px-2 py-0.5 rounded">
                  {report?.profitMarginPercent ? `${report.profitMarginPercent.toFixed(0)}% Margin` : "0% Margin"}
                </Text>
              </View>

              <Text className="text-3xl font-extrabold text-green-700">
                {formatPHP(report?.netProfit || 0)}
              </Text>
            </View>

            {/* Metrics Grid: Total Orders & Total COGS (Replaced Avg Ticket Size) */}
            <View className="flex-row justify-between gap-x-3">
              <View className="flex-1 bg-white p-4 rounded-xl border border-neutral-200">
                <Text className="text-xs font-body text-neutral-400 mb-1">Total Orders</Text>
                <Text className="text-xl font-bodyBold text-neutral-900">
                  {report?.totalOrders || 0}
                </Text>
              </View>

              <View className="flex-1 bg-white p-4 rounded-xl border border-neutral-200">
                <Text className="text-xs font-body text-neutral-400 mb-1">Total COGS</Text>
                <Text className="text-xl font-bodyBold text-red-600">
                  {formatPHP(report?.totalCOGS || 0)}
                </Text>
              </View>
            </View>

            {/* Net Profit Breakdown Section (Daily for Weekly, Weekly for Monthly) */}
            <View className="bg-white p-5 rounded-2xl border border-neutral-200 mt-2 shadow-sm">
              <Text className="text-base font-bodyBold text-neutral-900 mb-3">
                {period === "week" ? "Net Profit per Day" : "Net Profit per Week"}
              </Text>

              {!report?.breakdown || report.breakdown.length === 0 ? (
                <Text className="text-sm font-body text-neutral-400 py-2">
                  No profit recorded in this period.
                </Text>
              ) : (
                <View className="gap-y-2">
                  {report.breakdown.map((item, index) => (
                    <View
                      key={index}
                      className="flex-row justify-between items-center py-2 border-b border-neutral-100"
                    >
                      <Text className="text-sm font-body text-neutral-700">{item.label}</Text>
                      <Text className="text-sm font-bodyBold text-green-600">
                        {formatPHP(item.netProfit)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        <TouchableOpacity onPress={() => router.replace("/owner-dash")} className="mt-10 self-center">
          <Text className="text-sm text-neutral-400 font-bodySemiBold underline">
            Back to Dashboard
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}