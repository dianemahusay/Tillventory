import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ID, Models } from "react-native-appwrite";
import { databases } from "../services/appwrite";
import { getProducts, invalidateProductsCache } from "../services/productsCache";
import { useGlobalProfiles } from "./_layout";

const DATABASE_ID = "6a694ca9001b95d71b14";
const PRODUCTS_COLLECTION_ID = "products";
const RESTOCK_COLLECTION_ID = "restock";
const LOGS_COLLECTION_ID = "inventory_logs";

export interface ProductItem extends Models.Document {
  product_name: string;
  quantity: number;
  continuing_stock: number;
  conversion_factor: number;
  unit: string;
  restock_unit: string;
}

export type InventoryAction = "Restock" | "Correct_count" | "Waste" | "Sale";

export interface InventoryLogDoc extends Models.Document {
  products_id: ProductItem | string;
  action_type: InventoryAction;
  qty_remaining: number;
  restocked_at?: string | null;
  note?: string;
  profiles_id?: string | null;
}

export default function RestockScreen() {
  const { username } = useLocalSearchParams();
  const { profiles } = useGlobalProfiles();

  const requestedName = typeof username === "string" ? username : "";
  const normalizedRequestedName = requestedName.trim().toLowerCase();

  const currentProfile = profiles.find((p: any) => {
    const pName = (p.name || "").trim().toLowerCase();
    return pName === normalizedRequestedName;
  });

  const profileName = currentProfile?.name || requestedName || "Owner";
  const isOwnerProfile =
    currentProfile?.role === "owner" ||
    (profileName || "").trim().toLowerCase() === "owner";

  const [selectedType, setSelectedType] = useState<InventoryAction>("Restock");
  const [quantity, setQuantity] = useState<string>("");
  const [expireDate, setExpireDate] = useState<string>("");
  const [note, setNote] = useState<string>("");

  const [productsList, setProductsList] = useState<ProductItem[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // DROPDOWN STATE CONTROLS
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  useEffect(() => {
    fetchScreenData();
  }, []);

  // Fetch registered Products and recent Inventory Audit Logs from Appwrite
  const fetchScreenData = async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      const products = await getProducts(databases, forceRefresh);
      setProductsList(products as unknown as ProductItem[]);
    } catch (error) {
      console.error("Error fetching restock data:", error);
      Alert.alert("Error", "Could not fetch data from Appwrite.");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchScreenData();
  };

  // 1. Calculate sum of quantities across all products (Tracked Stock rounded UP to whole units)
  const totalTrackedStock = productsList.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    return sum + Math.ceil(qty);
  }, 0);

  // 2. Calculate number of products running low (e.g. quantity <= 5)
  const lowStockCount = productsList.filter((item) => {
    const qty = Number(item.quantity) || 0;
    
    // Normalize unit string to lowercase to prevent casing mismatches (e.g., "Tbsp" vs "tbsp")
    const unit = (item.unit || "").trim().toLowerCase();

    // Check if unit is tbsp, tsp, or shot
    const isSmallUnit = ["tbsp", "tsp", "shot", "pcs"].includes(unit);
    
    // Set threshold to 3 for tbsp/tsp/shot, otherwise default to 5
    const threshold = isSmallUnit ? 1 : 3;

    return qty <= threshold;
  }).length;

  // Submit Inventory Adjustment to Appwrite
  const handleUpdateStock = async () => {
    if (!selectedProduct) {
      Alert.alert("Error", "Please select an inventory item.");
      return;
    }

    const qtyNum = parseFloat(quantity);
    if (isNaN(qtyNum) || (selectedType !== "Correct_count" && qtyNum <= 0) || qtyNum < 0) {
      Alert.alert("Error", "Please enter a valid quantity.");
      return;
    }

    setIsSubmitting(true);

    try {
      const factor = Number(selectedProduct.conversion_factor || 1);
      const currentPackages = Number(selectedProduct.quantity || 0);
      const currentBaseStock = Number(selectedProduct.continuing_stock ?? currentPackages * factor);  

      let updatedPackages = currentPackages;
      let updatedBaseStock = currentBaseStock;
      let actualPackageChange = qtyNum;

      if (selectedType === "Restock") {
        // Adding packages (e.g. +1 jar)
        updatedPackages = currentPackages + qtyNum;
        const baseUnitsAdded = qtyNum * factor; // +50 shots
        updatedBaseStock = currentBaseStock + baseUnitsAdded;
        actualPackageChange = qtyNum;
      } else if (selectedType === "Waste") {
        // Subtracting packages (e.g. -1 jar)
        updatedPackages = Math.max(0, currentPackages - qtyNum);
        const baseUnitsWasted = qtyNum * factor;
        updatedBaseStock = Math.max(0, currentBaseStock - baseUnitsWasted);
        actualPackageChange = -qtyNum;
      } else if (selectedType === "Correct_count") {
        // Setting exact package count (e.g. set total to 2 jars)
        updatedPackages = qtyNum;
        updatedBaseStock = qtyNum * factor;
        actualPackageChange = qtyNum - currentPackages;
      }

      // 2. Update overall stock level in `products` collection with recalculated value
      await databases.updateDocument(
        DATABASE_ID,
        PRODUCTS_COLLECTION_ID,
        selectedProduct.$id,
        { quantity: updatedPackages,
          continuing_stock: updatedBaseStock,
        }  
      );

      // 3. Create entry in `restock` collection if it's a restock
      if (selectedType === "Restock") {
        await databases.createDocument(
          DATABASE_ID,
          RESTOCK_COLLECTION_ID,
          ID.unique(),
          {
            products_id: selectedProduct.$id,
            qty_added: qtyNum,
            restocked_at: new Date().toISOString(),
            expire_date: expireDate ? new Date(expireDate).toISOString() : null,
          }
        );
      }

      // 4. Save to `inventory_logs` for audit tracking
      await databases.createDocument(
        DATABASE_ID,
        LOGS_COLLECTION_ID,
        ID.unique(),
        {
          products_id: selectedProduct.$id,
          action_type: selectedType,
          quantity_changed: actualPackageChange,
          note: note.trim() || "Inventory updated",
          profile_name: profileName, 
          profiles_id: currentProfile?.$id || undefined, 
        }
      );

      Alert.alert("Success", `Stock updated for ${selectedProduct.product_name}!`);

      // Reset form fields & refresh UI list
      setQuantity("");
      setNote("");
      setExpireDate?.(""); // Reset expire date if state exists
      setSelectedProduct(null);
      setIsDropdownOpen(false);

      // Invalidate the cached products so other screens will get fresh data
      invalidateProductsCache();
      fetchScreenData(true);
    } catch (error: any) {
      console.error("Failed to update stock:", error);
      Alert.alert("Error", error?.message || "Could not update stock in Appwrite.");
    } finally {
      setIsSubmitting(false);
    }
  };


  // Format ISO timestamp to readable local time (e.g., 4:09 PM)
  const formatTime = (isoString: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <ScrollView 
      style={{ flex: 1 }} 
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      className="bg-background px-6 pt-20"
    >
      {/* Top Branding Section */}
      <View className="mb-6">
        <Text className="text-4xl text-neutral-800 font-heading pb-2 border-b border-neutral-400">
          Tillventory
        </Text>
      </View>


      {/* Summary Stat Deck Block Cards Row */}
      <View className="flex-row justify-between mb-8">
        {/* Tracked Metric Panel */}
        <View className="w-[48%] bg-neutral-200/60 p-4 rounded-[20px]">
          <Text className="text-sm font-bodyBold text-neutral-800 mb-1">Tracked Stock</Text>
          <Text className="text-4xl font-bodyBold text-neutral-900">
            {isLoading ? "-" : totalTrackedStock}
          </Text>
        </View>

        {/* Low Stock Alert Panel */}
        <View className="w-[48%] bg-neutral-200/60 p-4 rounded-[20px]">
          <Text className="text-sm font-bodyBold text-neutral-800 mb-1">Low Stock</Text>
          <Text className="text-4xl font-bodyBold text-red-600">
            {isLoading ? "-" : lowStockCount}
          </Text>
        </View>
      </View>

      {/* Main Inventory Card */}
      <View className="bg-neutral-200/50 p-5 rounded-[28px] mb-8 gap-y-4" style={{ zIndex: 1 }}>
        
        {/* Item Selector Dropdown */}
        <View style={{ zIndex: 10 }}>
          <Text className="text-sm font-bodyBold text-neutral-900 mb-1.5">Item</Text>
          
          <TouchableOpacity 
            onPress={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full h-10 bg-white border border-neutral-300 rounded-xl px-4 flex-row justify-between items-center"
          >
            <Text className={`font-body ${selectedProduct ? "text-neutral-900" : "text-neutral-500"}`}>
              {selectedProduct ? selectedProduct.product_name : "Select item..."}
            </Text>
            <Text className="text-xs text-neutral-500 font-body">
              {isDropdownOpen ? "▲" : "▼"}
            </Text>
          </TouchableOpacity>

          {isDropdownOpen && (
            <View className="w-full bg-white border border-neutral-300 rounded-xl mt-1 overflow-hidden shadow-md max-h-48">
              <ScrollView nestedScrollEnabled>
                {productsList.length === 0 ? (
                  <Text className="p-3 text-xs text-neutral-400 font-body text-center">
                    No registered products found.
                  </Text>
                ) : (
                  productsList.map((item) => (
                    <TouchableOpacity
                      key={item.$id}
                      onPress={() => {
                        setSelectedProduct(item);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full py-3 px-4 border-b border-neutral-100 active:bg-neutral-50 flex-row justify-between"
                    >
                      <Text className="text-sm text-neutral-800 font-body">{item.product_name}</Text>
                      <Text className="text-xs text-neutral-400 font-body">
                        {item.quantity || 0} {item.unit || "g"}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Type Actions Pill Selector */}
        <View>
          <Text className="text-sm font-bodyBold text-neutral-900 mb-1.5">Type</Text>
          <View className="flex-row overflow-hidden rounded-xl border border-neutral-400 bg-white">
            <Pressable
              onPress={() => setSelectedType("Restock")}
              hitSlop={10}
              style={{
                flex: 1,
                minHeight: 48,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: selectedType === "Restock" ? "#F5F5F4" : "#FFFFFF",
                borderRightWidth: 1,
                borderRightColor: "#D4D4D4",
                paddingHorizontal: 6,
              }}
            >
              <Text className="text-[12px] font-bodyBold text-neutral-900 text-center">
                Restock
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSelectedType("Correct_count")}
              hitSlop={10}
              style={{
                flex: 1,
                minHeight: 48,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: selectedType === "Correct_count" ? "#F5F5F4" : "#FFFFFF",
                borderRightWidth: 1,
                borderRightColor: "#D4D4D4",
                paddingHorizontal: 6,
              }}
            >
              <Text className="text-[12px] font-bodyBold text-neutral-900 text-center">
                Correct Count
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSelectedType("Waste")}
              hitSlop={10}
              style={{
                flex: 1,
                minHeight: 48,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: selectedType === "Waste" ? "#F5F5F4" : "#FFFFFF",
                paddingHorizontal: 6,
              }}
            >
              <Text className="text-[12px] font-bodyBold text-neutral-900 text-center">
                Waste
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Quantity Text Input */}
        <View>
          <Text className="text-sm font-bodyBold text-neutral-900 mb-1.5">
            {selectedType === "Correct_count" ? "New Total Count" : "Quantity Amount"}
          </Text>
          <TextInput
            keyboardType="numeric"
            value={quantity}
            onChangeText={setQuantity}
            placeholder="0"
            placeholderTextColor="#A3A3A3"
            className="w-full h-10 bg-white border border-neutral-300 rounded-xl px-4 text-neutral-900 font-body"
          />
        </View>

        {/* Conditional Expiration Date Field for Restocks */}
        {selectedType === "Restock" && (
          <View>
            <Text className="text-sm font-bodyBold text-neutral-900 mb-1.5">
              Expiration Date 
            </Text>
            <TextInput
              value={expireDate}
              onChangeText={setExpireDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#A3A3A3"
              className="w-full h-12 bg-white border border-neutral-300 rounded-xl px-4 text-neutral-900 font-body"
            />
          </View>
        )}

        {/* Note Input with Focused Blue Stroke Accent styling */}
        <View>
          <Text className="text-sm font-bodyBold text-neutral-900 mb-1.5">Note <Text className="text-neutral-400 font-body">(Optional)</Text> </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Add additional notes..."
            placeholderTextColor="#A3A3A3"
            className="w-full h-10 bg-white rounded-xl px-4 text-neutral-900 font-body"
          />
        </View>

        <TouchableOpacity
          disabled={isSubmitting}
          onPress={handleUpdateStock}
          className={`w-full h-12 rounded-xl items-center justify-center ${
            isSubmitting ? "bg-neutral-400" : "bg-accent"
          }`}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-white font-bodyBold text-sm">
              {selectedType === "Restock"
                ? "Restock Now"
                : selectedType === "Waste"
                ? "Record Waste"
                : "Update Count"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Navigation Redirect Button */}
      <TouchableOpacity
        onPress={() => router.replace(isOwnerProfile ? "/owner-dash" : "/new-sale")}
        className="mt-2 self-center"
      >
        <Text className="text-sm text-neutral-400 font-bodySemiBold underline">
          Back to Dashboard
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
