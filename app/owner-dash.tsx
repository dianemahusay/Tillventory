import React from "react";
import { Text, View, ScrollView, TouchableOpacity } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

export default function OwnerDashboard() {
  const { username } = useLocalSearchParams();

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 40, paddingTop: 20 }}
      className="bg-background px-6 pt-16"
    >
      {/* Header Branding Block */}
      <View className="mb-6">
        <Text className="text-4xl font-heading pb-2 border-b border-neutral-400">
          Cafe Uno
        </Text>
      </View>

      {/* Main Metric Cards Layout Row */}
      <View className="flex-row justify-between mb-4">
        {/* Today's Sales Panel */}
        <View className="w-[48%] bg-neutral-200/60 p-4 rounded-xl">
          <Text className="text-sm font-bold text-neutral-800 mb-2">Today's sale</Text>
          <Text className="text-3xl font-extrabold text-neutral-900">29,8190</Text>
        </View>

        {/* Orders Today Panel */}
        <View className="w-[48%] bg-neutral-200/60 p-4 rounded-xl">
          <Text className="text-sm font-bold text-neutral-800 mb-2">Orders today</Text>
          <Text className="text-3xl font-extrabold text-neutral-900">27</Text>
        </View>
      </View>

      {/* Low Stock Attention Warning Banner */}
      <View className="bg-[#E8C4C4]/60 flex-row items-center px-4 py-3 rounded-xl mb-6 gap-x-2">
        <Text className="text-red-700 text-base font-bold">⚠️</Text>
        <Text className="text-red-700 text-sm font-bold">2 items needs restocking</Text>
      </View>

      {/* Quick Actions Dashboard Grid Section */}
      <Text className="text-lg font-bodyBold text-neutral-900 mb-3">Quick Actions</Text>

      {/* Row 1: Your three original buttons remain untouched */}
      <View className="flex-row justify-between mb-4">
        {/* 1. New Sale Button */}
        <TouchableOpacity
          onPress={() => router.push({
            pathname: "/new-sale",
            params: { username: username }
          })}
          className="w-[30%] bg-white border border-neutral-800 rounded-xl py-4 items-center justify-center active:bg-neutral-100"
        >
          <Text className="text-2xl mb-1">🛒</Text>
          <Text className="text-xs font-bodyBold text-neutral-900">New Sale</Text>
        </TouchableOpacity>

        {/* 2. Restock Button */}
        <TouchableOpacity
          onPress={() => router.push("/restock")}
          className="w-[30%] bg-white border border-neutral-800 rounded-xl py-4 items-center justify-center active:bg-neutral-100"
        >
          <Text className="text-2xl mb-1">🧺</Text>
          <Text className="text-xs font-bodyBold text-neutral-900">Restock</Text>
        </TouchableOpacity>

        {/* 3. Recipes Button (Kept exactly where it was) */}
        <TouchableOpacity
          onPress={() => router.push("/recipes")}
          className="w-[30%] bg-white border border-neutral-800 rounded-xl py-4 items-center justify-center active:bg-neutral-100"
        >
          <Text className="text-2xl mb-1">🍳</Text>
          <Text className="text-xs font-bodyBold text-neutral-900">Recipes</Text>
        </TouchableOpacity>
      </View>

      {/* Row 2: Added to house the new Staff Management module cleanly */}
      <View className="flex-row justify-start mb-8">
        {/* 4. New Profiles Management Action Card */}
        <TouchableOpacity
          onPress={() => router.push("/manage-profiles")}
          className="w-[30%] bg-white border border-neutral-800 rounded-xl py-4 items-center justify-center active:bg-neutral-100"
        >
          <Text className="text-2xl mb-1">👥</Text>
          <Text className="text-xs font-bodyBold text-neutral-900">Staff Tools</Text>
        </TouchableOpacity>
      </View>



      {/* Needs Attention Alert List Section */}
      <Text className="text-lg font-bold text-neutral-900 mb-3">Needs Attention</Text>
      <View className="mb-8 gap-y-4">
        {/* Row 1: Coffee Beans */}
        <View className="flex-row justify-between items-center pb-3 border-b border-danger-300">
          <View>
            <Text className="text-md font-bold text-neutral-900">Coffee Beans (kg)</Text>
            <Text className="text-sm text-danger-400 mt-0.5">0.4 left - reorder at 1</Text>
          </View>
          <TouchableOpacity className="bg-red-50 border border-red-500 px-5 py-1.5 rounded-xl">
            <Text className="text-md font-bold text-red-500">Restock</Text>
          </TouchableOpacity>
        </View>

        {/* Row 2: Full Milk */}
        <View className="flex-row justify-between items-center pb-3 border-b border-danger-300">
          <View>
            <Text className="text-md font-bold text-neutral-900">Full Milk (carton)</Text>
            <Text className="text-sm text-danger-400 mt-0.5">1 left - reorder at 7pm</Text>
          </View>
          <TouchableOpacity className="bg-red-50 border border-red-500 px-5 py-1.5 rounded-xl">
            <Text className="text-md font-bold text-red-500">Restock</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activities Timeline History List */}
      <Text className="text-lg font-bold text-neutral-900 mb-4">Recent Activities</Text>
      <View className="gap-y-4">
        {/* Log item 1 */}
        <View className="flex-row items-start gap-x-3">
          <View className="w-10 h-10 rounded-full bg-neutral-300/60 justify-center items-center mt-0.5">
            <Text className="text-base">🍳</Text>
          </View>
          <View className="flex-1">
            <Text className="text-md text-neutral-900 font-medium">
              <Text className="font-bold">Kate (Owner)</Text> added a new recipe "Ube Matcha"
            </Text>
            <Text className="text-sm text-neutral-400 mt-0.5">4:09PM</Text>
          </View>
        </View>

        {/* Log item 2 */}
        <View className="flex-row items-start gap-x-3">
          <View className="w-10 h-10 rounded-full bg-neutral-300/60 justify-center items-center mt-0.5">
            <Text className="text-base">🛒</Text>
          </View>
          <View className="flex-1">
            <Text className="text-md text-neutral-900 font-medium">
              <Text className="font-bold">Maria Sold 1x</Text> Dirty Matcha and Rice Meal
            </Text>
            <Text className="text-sm text-neutral-400 mt-0.5">12:44PM</Text>
          </View>
        </View>

        {/* Log item 3 */}
        <View className="flex-row items-start gap-x-3">
          <View className="w-10 h-10 rounded-full bg-neutral-300/60 justify-center items-center mt-0.5">
            <Text className="text-base">🛒</Text>
          </View>
          <View className="flex-1">
            <Text className="text-md text-neutral-900 font-medium">
              <Text className="font-bold">Tomas Sold 2x</Text> Green Apple Soda
            </Text>
            <Text className="text-sm text-neutral-400 mt-0.5">3:03PM</Text>
          </View>
        </View>

        {/* Log item 4 */}
        <View className="flex-row items-start gap-x-3">
          <View className="w-10 h-10 rounded-full bg-neutral-300/60 justify-center items-center mt-0.5">
            <Text className="text-base">🧺</Text>
          </View>
          <View className="flex-1">
            <Text className="text-md text-neutral-900 font-medium">
              <Text className="font-bold">Tomas Restock</Text> Milk +5
            </Text>
            <Text className="text-sm text-neutral-400 mt-0.5">5:51PM</Text>
          </View>
        </View>
      </View>

      {/* Floating System Return/Logout Utility link */}
      <TouchableOpacity
        onPress={() => router.replace("/")}
        className="mt-8 self-center"
      >
        <Text className="text-sm text-neutral-400 font-semibold underline">
          Exit Owner Panel
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
