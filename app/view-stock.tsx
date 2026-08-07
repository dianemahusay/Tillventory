import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { databases } from "../services/appwrite";
import { getProducts } from "../services/productsCache";
import { isProductLowStock, ProductItem, renderStockText } from "../services/stockUtils";

const DATABASE_ID = "6a694ca9001b95d71b14";
const PRODUCTS_COLLECTION_ID = "products";

export default function ViewStockScreen() {
  const { username } = useLocalSearchParams();
  const activeUsername = typeof username === "string" ? username : "";

  const [lowStockItems, setLowStockItems] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    fetchStockData();
  }, []);

  const fetchStockData = async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      const allProducts = await getProducts(databases, forceRefresh);

      // --- Filter ONLY low stock products ---
      const onlyLowStock = allProducts.filter((item) => isProductLowStock(item));
      setLowStockItems(onlyLowStock);
    } catch (error) {
      console.error("Error fetching stock items:", error);
      Alert.alert("Error", "Failed to load stock data from Appwrite.");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void fetchStockData(true);
  }, []);

  return (
    <View style={{ flex: 1 }} className="bg-background pt-16">
      {/* iOS FULLSCREEN NAVIGATION OVERRIDE */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* Static Header Section */}
      <View className="px-6 mb-4">
        <Text className="text-4xl text-textPrimary font-heading pb-2 border-b border-neutral-400 mt-4">
          Cafe Uno
        </Text>
      </View>

      {/* Main Stock Scroll Inventory View List */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }}
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Descriptive Warning Prompt Message Subheading */}
        <Text className="text-base text-neutral-400 font-body mb-5">
          Items requiring restock attention.
        </Text>

        {isLoading ? (
          <ActivityIndicator color="#171717" size="large" className="py-8 mb-8" />
        ) : lowStockItems.length === 0 ? (
          <Text className="text-sm text-neutral-400 font-body py-8 text-center">
            All stock levels are sufficient.
          </Text>
        ) : (
          <View className="mb-8 gap-y-4">
            {lowStockItems.map((item) => (
              <View
                key={item.$id}
                className="flex-row justify-between items-center pb-3 border-b border-neutral-300"
              >
                <View className="flex-1 pr-2">
                  <Text className="text-md font-bodyBold text-neutral-900">
                    {item.product_name}
                  </Text>
                  <Text className="text-sm mt-0.5 font-bodyBold text-red-500">
                    {renderStockText(item)}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/restock",
                      params: { productId: item.$id, username: activeUsername },
                    })
                  }
                  className="px-5 py-1.5 rounded-xl border bg-red-50 border-red-500 active:bg-red-100"
                >
                  <Text className="text-md font-bodyBold text-red-500">
                    Restock
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Back navigation option link */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-12 self-center"
        >
          <Text className="text-sm text-neutral-400 font-bodySemiBold underline">
            Close Stock View
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}