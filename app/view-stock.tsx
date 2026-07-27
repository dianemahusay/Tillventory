import React from "react";
import { Text, View, ScrollView, TouchableOpacity } from "react-native";
import { router, Stack } from "expo-router";

export default function ViewStockScreen() {
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

      {/* Summary Stat Deck Block Cards Row */}
      <View className="flex-row justify-between px-6 mb-8">
        {/* Tracked Metric Panel */}
        <View className="w-[48%] bg-neutral-200/60 p-4 rounded-[20px]">
          <Text className="text-sm font-bodyBold text-neutral-800 mb-1">Tracked</Text>
          <Text className="text-4xl font-bodyBold text-neutral-900">9</Text>
        </View>

        {/* Low Stock Alert Panel */}
        <View className="w-[48%] bg-neutral-200/60 p-4 rounded-[20px]">
          <Text className="text-sm font-bodyBold text-neutral-800 mb-1">Low Stock</Text>
          <Text className="text-4xl font-bodyBold text-red-600">2</Text>
        </View>
      </View>

      {/* Main Stock Scroll Inventory View List */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }} className="flex-1">
        {/* Descriptive Warning Prompt Message Subheading */}
        <Text className="text-base text-neutral-400 font-body mb-5">
          View Only. Ask the Owner to log a restock.
        </Text>

        <View className="w-full">
          {/* Row Item 1: Coffee Beans */}
          <View className="flex-row justify-between items-center py-3 border-b border-neutral-800">
            <View className="flex-1 pr-2">
              <Text className="text-lg text-neutral-900 font-bodyBold">Coffee Beans (kg)</Text>
              <Text className="text-sm text-neutral-400 font-body mt-0.5">0.4 left - reorder now</Text>
            </View>
            <View className="border border-red-500 bg-red-50 rounded-xl px-4 py-2 justify-center items-center">
              <Text className="text-md text-red-500 font-bodySemiBold">Restock now</Text>
            </View>
          </View>

          {/* Row Item 2: Full Milk */}
          <View className="flex-row justify-between items-center py-3 border-b border-neutral-800">
            <View className="flex-1 pr-2">
              <Text className="text-lg text-neutral-900 font-bodyBold">Full Milk (carton)</Text>
              <Text className="text-sm text-neutral-400 font-body mt-0.5">1 left - reorder now</Text>
            </View>
            <View className="border border-red-500 bg-red-50 rounded-xl px-4 py-2 justify-center items-center">
              <Text className="text-md text-red-500 font-bodySemiBold">Restock now</Text>
            </View>
          </View>

          {/* Row Item 3: Loaves of Bread */}
          <View className="flex-row justify-between items-center py-3 border-b border-neutral-800">
            <View className="flex-1 pr-2">
              <Text className="text-lg text-neutral-900 font-bodyBold">Loaves of Bread</Text>
              <Text className="text-sm text-neutral-400 font-body mt-0.5">10 left - reorder at 5</Text>
            </View>
            <View className="bg-[#8BC34A]/20 border border-[#8BC34A] rounded-xl px-4 py-2 justify-center items-center w-[60px]">
              <Text className="text-md text-green-700 font-bodySemiBold">Ok</Text>
            </View>
          </View>

          {/* Row Item 4: Uncooked Croissants */}
          <View className="flex-row justify-between items-center py-3 border-b border-neutral-800">
            <View className="flex-1 pr-2">
              <Text className="text-lg text-neutral-900 font-bodyBold">Uncooked Croissants</Text>
              <Text className="text-sm text-neutral-400 font-body mt-0.5">20 left - reorder at 10</Text>
            </View>
            <View className="bg-[#8BC34A]/20 border border-[#8BC34A] rounded-xl px-4 py-2 justify-center items-center w-[60px]">
              <Text className="text-md text-green-700 font-bodySemiBold">Ok</Text>
            </View>
          </View>
        </View>

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
