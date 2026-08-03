import React, { useState, useEffect } from "react";
import {Alert} from "react-native";
import { Text, View, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams, Stack } from "expo-router";
import { Models, ID, Query } from "react-native-appwrite";
import { databases } from '../services/appwrite';
import { useGlobalProfiles } from "./_layout";


// Blueprints for your local cart entries
interface MenuItem extends Models.Document {
  item_name: string;
  price: number;
  category: string;
}

// Blueprints for local cart entries
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const DATABASE_ID = '6a694ca9001b95d71b14'; 
const MENU_COLLECTION_ID = 'menu_items';
const RECIPES_COLLECTION_ID = "recipe";
const SALE_COLLECTION_ID = "sales";
const LOGS_COLLECTION_ID = "inventory_logs"; 
const PRODUCTS_COLLECTION_ID = "products";

export default function NewSale() {
  const { username } = useLocalSearchParams();

  const { profiles} = useGlobalProfiles();
  const currentProfile = profiles.find((p) => p.name === username);

  // Core layout tracking states
  const [activeCategory, setActiveCategory] = useState<"All" | "Drinks" | "Foods" | "Pastries">("All");
  const [showSidebar, setShowSidebar] = useState<boolean>(false);
  const [cart, setCart] = useState<Record<string, CartItem>>({});

  // Clean menu dataset containing prices mapped as raw compute floats
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setIsLoading(true);
      const response = await databases.listDocuments(
        DATABASE_ID,
        MENU_COLLECTION_ID
      );
      setMenuItems(response.documents as unknown as MenuItem[]);
    } catch (error: any) {
      console.error("Failed to fetch menu items from Appwrite:", error);
      Alert.alert("Error Loading Menu", "Could not fetch menu items. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Append items to cart state on tap interaction
  const handleAddItem = (item: MenuItem) => {
    const itemId = item.$id;

    setCart((prev) => {
      const existing = prev[itemId];
      return {
        ...prev,
        [itemId]: {
          id: itemId,
          name: item.item_name,
          price: item.price,
          quantity: existing ? existing.quantity + 1 : 1,
        },
      };
    });
  };

  const cartArray = Object.values(cart);
  const totalAmount = cartArray.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Auto handles category changes dynamically across layout
  const filteredItems = menuItems.filter(({category}) => {
    if (activeCategory === "All") return true;
    return category?.toLowerCase() === activeCategory.toLowerCase();
  });

  const handleChargeOrder = async () => {
    if (cartArray.length === 0) return;

    setIsLoading(true);

    try {
      // 1. Process recipe inventory deductions for each item in the cart
      for (const item of cartArray) {
        // Fetch the recipe ingredients needed for this menu item
        const recipeRes = await databases.listDocuments(
          DATABASE_ID,
          RECIPES_COLLECTION_ID,
          [Query.equal("menu_items_Id", item.id)]
        );

        // Loop through each ingredient in the recipe and deduct stock
        for (const recipeIngredient of recipeRes.documents) {
          const productId = recipeIngredient.products_id?.$id || recipeIngredient.products_id;
          const amountPerOrder = Number(recipeIngredient.amount || 0);
          const totalDeduction = amountPerOrder * item.quantity; // Scale by ordered cart quantity

          if (productId && totalDeduction > 0) {
            // Fetch current live product document to get current stock balance
            const productDoc = await databases.getDocument(
              DATABASE_ID,
              PRODUCTS_COLLECTION_ID,
              productId
            );

            const currentStock = Number(productDoc.quantity || 0);
            const newStock = Math.max(0, currentStock - totalDeduction);

            // Update new stock balance in products collection
            await databases.updateDocument(
              DATABASE_ID,
              PRODUCTS_COLLECTION_ID,
              productId,
              { quantity: newStock }
            );

            // Create audit trail in inventory_logs
            await databases.createDocument(
              DATABASE_ID,
              LOGS_COLLECTION_ID,
              ID.unique(),
              {
                products_id: productId,
                action_type: "Sale",
                quantity_changed: -totalDeduction, // Negative delta for sales
                note: `Automated order deduction: ${item.quantity}x ${item.name}`,
              }
            );
          }
        }
      }

      // 2. Create the final Sale record in `sales` collection
      const itemsSummary = cartArray
        .map((item) => `${item.quantity}x ${item.name}`)
        .join(", ");

      await databases.createDocument(
        DATABASE_ID,
        SALE_COLLECTION_ID,
        ID.unique(),
        {
          total_price: totalAmount,
          items_summary: itemsSummary,
          profiles_id: currentProfile?.$id || undefined,
        }
      );

      Alert.alert("Sale Complete!", `Successfully charged PHP ${totalAmount.toFixed(2)}`);

      // 3. Clear cart and refresh menu
      setCart({});
      fetchMenuItems();
    } catch (error: any) {
      console.error("Failed to complete sale & deduct stock:", error);
      Alert.alert("Transaction Error", error?.message || "Could not process order deduction.");
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <View style={{ flex: 1 }} className="bg-background pt-16">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Main Grid Scroll Content Box Layout */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 280, paddingTop: 20 }}>

        {/* Top Header Section with Hamburger on the right ONLY for staff */}
        <View className="flex-row justify-between items-center mb-4 border-b border-neutral-300 pb-2">
          <Text className="text-4xl text-textPrimary font-heading">
            Cafe Uno
          </Text>

          {/* STAFF CONDITION GUARD: Menu button strictly stays hidden if owner (Kate) logs in */}
          {currentProfile?.role !== "owner" && (
            <TouchableOpacity
              onPress={() => setShowSidebar(true)}
              className="p-2 bg-neutral-200/60 rounded-xl active:bg-neutral-300"
            >
              <Text className="text-2xl text-neutral-800 font-bodyBold">☰</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Dynamic Category Pill Filters */}
        <View className="flex-row gap-x-2 mb-6">
          {(["All", "Drinks", "Foods", "Pastries"] as const).map((category) => {
            const isSelected = activeCategory === category;
            return (
              <TouchableOpacity
                key={category}
                onPress={() => setActiveCategory(category)}
                className={`border border-neutral-900 rounded-full px-4 py-1 ${isSelected ? "bg-neutral-900" : "bg-white"
                  }`}
              >
                <Text className={`text-sm font-bodySemiBold ${isSelected ? "text-white" : "text-neutral-900"}`}>
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Dynamic Menu Items Grid / Loader */}
        {isLoading ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#171717" />
            <Text className="text-sm font-body text-neutral-500 mt-3">Loading menu items...</Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View className="py-20 items-center justify-center">
            <Text className="text-base font-body text-neutral-500">No items found in this category.</Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between gap-y-4">
            {filteredItems.map((item) => {
              const parsedName = (item.item_name || "")
                .replace("Fried ", "Fried\n")
                .replace("Cheese ", "Cheese\n")
                .replace("Tea ", "Tea\n");

              return (
                <TouchableOpacity
                  key={item.$id}
                  onPress={() => handleAddItem(item)}
                  className="w-[48%] h-28 bg-white border border-neutral-900 rounded-2xl p-4 justify-between active:bg-neutral-50"
                >
                  <Text className="text-base text-textPrimary font-bodyBold leading-tight" numberOfLines={2}>
                    {parsedName}
                  </Text>
                  <Text className="text-sm text-textPrimary-400 font-body">
                    P{Number(item.price || 0).toFixed(2)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Persistent Bottom Checkout Summary Panel */}
      <View className="absolute bottom-0 left-0 right-0 bg-neutral-200/95 rounded-t-[32px] p-6 pb-10 border-t border-neutral-300">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-md text-neutral-800 font-bodyBold">
            Order - rung up by {username || "Staff"}
          </Text>
          <TouchableOpacity onPress={() => setCart({})}>
            <Text className="text-sm text-neutral-500 font-body underline">Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Basket Content Row */}
        <View className="min-h-[40px] max-h-[80px] mb-4">
          {cartArray.length === 0 ? (
            <Text className="text-sm text-neutral-400 font-body mt-2">
              Tap an order to add it.
            </Text>
          ) : (
            <ScrollView nestedScrollEnabled style={{ flex: 1 }} className="py-1">
              <Text className="text-sm text-neutral-600 font-body">
                {cartArray.map(item => `${item.quantity}x ${item.name}`).join(", ")}
              </Text>
            </ScrollView>
          )}
        </View>

        <View className="w-full h-[1px] bg-neutral-800 mb-4" />

        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-lg text-neutral-900 font-bodyBold">Total</Text>
          <Text className="text-lg text-neutral-900 font-bodyBold">
            PHP {totalAmount.toFixed(2)}
          </Text>
        </View>

        <TouchableOpacity
          disabled={cartArray.length === 0 || isLoading}
          onPress={handleChargeOrder}
          className={`w-full py-4 rounded-xl items-center shadow-sm ${
            cartArray.length === 0 || isLoading
              ? "bg-neutral-400 opacity-60"
              : "bg-accent active:opacity-90"
          }`}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text className="text-white text-base font-bodyBold">
              Charge
            </Text>
          )}
        </TouchableOpacity>

        {/* Bottom context router helper to return to dashboard strictly for Kate */}
        {username === "Kate" && (
          <TouchableOpacity onPress={() => router.replace("/owner-dash")} className="mt-4 self-center">
            <Text className="text-xs text-neutral-400 font-bodySemiBold underline">Back to Dashboard</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* --- STAFF SLIDE-OUT OVERLAY SIDEBAR INTERFACE --- */}
      {showSidebar && username !== "Kate" && (
        <View className="absolute inset-0 bg-black/40 flex-row justify-end" style={{ zIndex: 100 }}>
          {/* Dismiss Back-tap area anchor */}
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowSidebar(false)} />

          {/* Sidebar Panel Block Container */}
          <View className="w-[260px] h-full bg-white p-6 pt-24 shadow-2xl">
            {/* Header Identity Panel */}
            <View className="flex-row justify-between items-center mb-10 pb-4 border-b border-neutral-200">
              <View>
                <Text className="text-lg text-neutral-900 font-bodyBold">Staff Control</Text>
                <Text className="text-sm text-neutral-400 font-body">Account: {username}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSidebar(false)}>
                <Text className="text-xl font-bodyBold text-neutral-800 px-2">✕</Text>
              </TouchableOpacity>
            </View>

            {/* Staff Options Panel Stack - FIXED tags pairs entirely below */}
            <View className="flex-1 gap-y-4">
              <TouchableOpacity
                onPress={() => {
                  setShowSidebar(false);
                  router.push({
                    pathname: "/view-stock",
                    params: { username: username } // Forwards active login details safely
                  });
                }}
                className="w-full py-3 px-4 bg-neutral-50 rounded-xl border border-neutral-200 active:bg-neutral-100"
              >
                <Text className="text-sm font-bodySemiBold text-neutral-800">📦 View Stock</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowSidebar(false);
                  router.push({
                    pathname: "/activity-log",
                    params: { username: username } // Forwards active login details safely
                  });
                }}
                className="w-full py-3 px-4 bg-neutral-50 rounded-xl border border-neutral-200 active:bg-neutral-100"
              >
                <Text className="text-sm font-bodySemiBold text-neutral-800">📋  Activity Log</Text>
              </TouchableOpacity>

              {/* Log out profile shift exit button */}
              <TouchableOpacity
                onPress={() => { setShowSidebar(false); router.replace("/"); }}
                className="w-full py-3 px-4 bg-red-50 rounded-xl border border-red-200 mt-auto mb-8 active:bg-red-100"
              >
                <Text className="text-sm font-bodyBold text-red-600 text-center">🔒 Log Out Shift</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
