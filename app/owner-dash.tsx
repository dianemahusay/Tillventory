import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Query } from "react-native-appwrite";
import { CombinedActivityLog, fetchCombinedActivities } from "../services/activityUtils";
import { databases } from "../services/appwrite";
import { getProducts } from "../services/productsCache";
import { filterLowStockProducts, ProductItem, renderStockText } from "../services/stockUtils";

const DATABASE_ID = "6a694ca9001b95d71b14";
const SALE_COLLECTION_ID = "sales";
const PRODUCTS_COLLECTION_ID = "products";

export default function OwnerDashboard() {
  const { username } = useLocalSearchParams();

  const [todaysSales, setTodaysSales] = useState<number>(0);
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [lowStockItems, setLowStockItems] = useState<ProductItem[]>([]);
  const [recentActivities, setRecentActivities] = useState<CombinedActivityLog[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // 1. Calculate Start of Today (00:00:00) ISO string
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const isoToday = startOfToday.toISOString();

      // 2. Fetch sales, products, and combined activities concurrently
      const [salesRes, productsList, activities] = await Promise.all([
        // Fetch Today's Sales
        databases.listDocuments(DATABASE_ID, SALE_COLLECTION_ID, [
          Query.greaterThanEqual("$createdAt", isoToday),
          Query.orderDesc("$createdAt"),
        ]),
        // Fetch All Products for Low Stock calculation (cached)
        getProducts(databases),
        // Fetch Recent Activity Stream using Shared Utility
        fetchCombinedActivities({ todayOnly: true, limit: 10 }),
      ]);

      // --- Calculate Today's Sales & Orders Count ---
      const salesDocs = salesRes.documents;
      setOrdersCount(salesDocs.length);

      const totalRevenue = salesDocs.reduce(
        (sum, doc: any) => sum + Number(doc.total_price || 0),
        0
      );
      setTodaysSales(totalRevenue);

      // --- Filter Low Stock Items using Shared Utility ---
      const allProducts = productsList as unknown as ProductItem[];
      setLowStockItems(filterLowStockProducts(allProducts));

      // --- Set Activities ---
      setRecentActivities(activities);
    } catch (error) {
      console.error("Error fetching owner dashboard data:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, []);

  const formatPHP = (amount: number) => {
    return `₱${amount.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 40, paddingTop: 20 }}
      className="bg-background px-6 pt-16"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="mb-6">
        <Text className="text-4xl font-heading pb-2 border-b border-neutral-400">
          Tillventory
        </Text>
      </View>

      {/* Metrics Row */}
      <View className="flex-row justify-between mb-4">
        <View className="w-[48%] bg-neutral-200/60 p-4 rounded-xl">
          <Text className="text-sm font-bold text-neutral-800 mb-2">Today's sale</Text>
          {isLoading ? (
            <ActivityIndicator color="#171717" size="small" />
          ) : (
            <Text className="text-2xl font-extrabold text-neutral-900">
              {formatPHP(todaysSales)}
            </Text>
          )}
        </View>

        <View className="w-[48%] bg-neutral-200/60 p-4 rounded-xl">
          <Text className="text-sm font-bold text-neutral-800 mb-2">Orders today</Text>
          {isLoading ? (
            <ActivityIndicator color="#171717" size="small" />
          ) : (
            <Text className="text-2xl font-extrabold text-neutral-900">
              {ordersCount}
            </Text>
          )}
        </View>
      </View>

      {/* Low Stock Warning Banner */}
      {lowStockItems.length > 0 && (
        <View className="bg-[#E8C4C4]/60 flex-row items-center px-4 py-3 rounded-xl mb-6 gap-x-2">
          <Text className="text-red-700 text-base font-bold">⚠️</Text>
          <Text className="text-red-700 text-sm font-bold">
            {lowStockItems.length}{" "}
            {lowStockItems.length === 1 ? "item needs" : "items need"} restocking
          </Text>
        </View>
      )}

      {/* Quick Actions */}
      <Text className="text-lg font-bodyBold text-neutral-900 mb-3">Quick Actions</Text>
      <View className="flex-row justify-between mb-4">
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/new-sale",
              params: { username: username },
            })
          }
          className="w-[30%] bg-white border border-neutral-800 rounded-xl py-4 items-center justify-center active:bg-neutral-100"
        >
          <Text className="text-2xl mb-1">🛒</Text>
          <Text className="text-xs font-bodyBold text-neutral-900">New Sale</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/restock",
              params: { username: username },
            })
          }
          className="w-[30%] bg-white border border-neutral-800 rounded-xl py-4 items-center justify-center active:bg-neutral-100"
        >
          <Text className="text-2xl mb-1">🧺</Text>
          <Text className="text-xs font-bodyBold text-neutral-900">Restock</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/recipes")}
          className="w-[30%] bg-white border border-neutral-800 rounded-xl py-4 items-center justify-center active:bg-neutral-100"
        >
          <Text className="text-2xl mb-1">🍳</Text>
          <Text className="text-xs font-bodyBold text-neutral-900">Recipes</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row justify-between mb-8">
        <TouchableOpacity
          onPress={() => router.push("/manage-profiles")}
          className="w-[30%] bg-white border border-neutral-800 rounded-xl py-4 items-center justify-center active:bg-neutral-100"
        >
          <Text className="text-2xl mb-1">👥</Text>
          <Text className="text-xs font-bodyBold text-neutral-900">Staff Tools</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/inventory-report")}
          className="w-[30%] bg-white border border-neutral-800 rounded-xl py-4 items-center justify-center active:bg-neutral-100"
        >
          <Text className="text-2xl mb-1">📊</Text>
          <Text className="text-xs font-bodyBold text-neutral-900">Inventory</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/sale-report")}
          className="w-[30%] bg-white border border-neutral-800 rounded-xl py-4 items-center justify-center active:bg-neutral-100"
        >
          <Text className="text-2xl mb-1">📈</Text>
          <Text className="text-xs font-bodyBold text-neutral-900">Sale Report</Text>
        </TouchableOpacity>
      </View>


      {/* Needs Attention List */}
      <Text className="text-lg font-bold text-neutral-900 mb-3">Needs Attention</Text>
      {isLoading ? (
        <ActivityIndicator color="#171717" size="small" className="py-4 mb-8" />
      ) : lowStockItems.length === 0 ? (
        <Text className="text-sm text-neutral-400 font-body mb-8">
          All stock levels are sufficient.
        </Text>
      ) : (
        <View className="mb-8 gap-y-4">
          {lowStockItems.map((item) => (
            <View
              key={item.$id}
              className="flex-row justify-between items-center pb-3 border-b border-black-200"
            >
              <View>
                <Text className="text-md font-bold text-neutral-900">
                  {item.product_name}
                </Text>
                <Text className="text-sm text-red-500 mt-0.5 font-body">
                  {renderStockText(item)}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/restock",
                    params: { productId: item.$id, username: username },
                  })
                }
                className="bg-red-50 border border-red-500 px-5 py-1.5 rounded-xl active:bg-red-100"
              >
                <Text className="text-md font-bold text-red-500">Restock</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Recent Activities */}
      <Text className="text-lg font-bold text-neutral-900 mb-4">Recent Activities</Text>
      {isLoading ? (
        <ActivityIndicator color="#171717" size="small" className="py-4" />
      ) : recentActivities.length === 0 ? (
        <Text className="text-sm text-neutral-400 font-body">
          No activities recorded today.
        </Text>
      ) : (
        <View className="gap-y-4">
          {recentActivities.map((activity) => (
            <View key={activity.id} className="flex-row items-start gap-x-3">
              <View className="w-10 h-10 rounded-full bg-neutral-300/60 justify-center items-center mt-0.5">
                <Text className="text-base">{activity.icon}</Text>
              </View>

              <View className="flex-1">
                <Text className="text-md text-neutral-900 font-medium">
                  {activity.title}
                </Text>
                <Text className="text-sm text-neutral-400 mt-0.5 font-body">
                  {activity.time}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity onPress={() => router.replace("/")} className="mt-8 self-center">
        <Text className="text-sm text-neutral-400 font-semibold underline">
          Exit Owner Panel
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
} 