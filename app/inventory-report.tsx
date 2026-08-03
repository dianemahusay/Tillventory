import React, { useState, useEffect } from "react";
import { router } from "expo-router";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import {
  fetchInventoryReport,
  InventoryReportItem,
  TimeframePeriod,
} from "../services/inventoryReportUtils";

export default function InventoryReportScreen() {
  const [period, setPeriod] = useState<TimeframePeriod>("month");
  const [reportData, setReportData] = useState<InventoryReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadReport();
  }, [period]);

  const loadReport = async () => {
    setIsLoading(true);
    const data = await fetchInventoryReport(period);
    setReportData(data);
    setIsLoading(false);
  };

  // --- CUSTOM DISPLAY FORMATTERS ---
  const renderRestockedText = (count: number, unit: string) => {
    if (count <= 0) {
      return <Text className="text-sm font-body text-neutral-400">—</Text>;
    }
    return (
      <Text className="text-sm font-bodyBold text-green-600">
        +{count} {unit}
      </Text>
    );
  };

  const renderUsedText = (count: number, unit: string) => {
    if (count <= 0) {
      return <Text className="text-sm font-body text-neutral-400">—</Text>;
    }
    return (
      <Text className="text-sm font-bodyBold text-red-500">
        -{count} {unit}
      </Text>
    );
  };

  const renderCurrentStockText = (count: number, unit: string) => {
    if (count <= 0) {
      return (
        <Text className="text-xs font-bodyBold text-red-600 bg-red-100 px-2 py-0.5 rounded-md overflow-hidden">
          Out of stock
        </Text>
      );
    }
    return (
      <Text className="text-sm font-bodyBold text-neutral-900">
        {count} {unit}
      </Text>
    );
  };

  return (
    <View style={{ flex: 1 }} className="bg-background pt-16">
      {/* Header */}
      <View className="px-6 mb-4">
        <Text className="text-4xl text-textPrimary font-heading pb-2 border-b border-neutral-400 mt-4">
          Cafe Uno
        </Text>
      </View>

      {/* Title & Period Selector */}
      <View className="px-6 mb-4 flex-row justify-between items-center">
        <Text className="text-xl font-bodyBold text-neutral-900">Inventory Summary</Text>

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

      {/* Main Report Table List */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }} className="flex-1">
        {isLoading ? (
          <ActivityIndicator color="#171717" size="large" className="py-10" />
        ) : reportData.length === 0 ? (
          <Text className="text-center text-neutral-400 font-body py-8">
            No inventory movements recorded for this {period}.
          </Text>
        ) : (
          <View className="gap-y-3">
            {reportData.map((item) => (
              <View
                key={item.productId}
                className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm"
              >
                <Text className="text-base font-bodyBold text-neutral-900 mb-2">
                  {item.productName}
                </Text>

                <View className="flex-row justify-between items-center pt-2 border-t border-neutral-100">
                  {/* Restocked Column */}
                  <View className="items-center flex-1">
                    <Text className="text-xs font-body text-neutral-400 mb-0.5">Restocked</Text>
                    {renderRestockedText(item.totalRestocked, item.restockUnit)}
                  </View>

                  {/* Used Column */}
                  <View className="items-center flex-1 border-x border-neutral-100 px-2">
                    <Text className="text-xs font-body text-neutral-400 mb-0.5">Used / Sold</Text>
                    {renderUsedText(item.totalUsed, item.unit)}
                  </View>

                  {/* In Stock Column */}
                  <View className="items-center flex-1">
                    <Text className="text-xs font-body text-neutral-400 mb-0.5">In Stock</Text>
                    {renderCurrentStockText(item.currentStock, item.unit)}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity onPress={() => router.back()} className="mt-10 self-center">
          <Text className="text-sm text-neutral-400 font-bodySemiBold underline">
            Back to Dashboard
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}