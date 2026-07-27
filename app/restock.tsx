import { router } from "expo-router";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

type InventoryAction = "Restock" | "Correct" | "Waste";

export default function RestockScreen() {
  const [selectedType, setSelectedType] = useState<InventoryAction>("Restock");
  const [quantity, setQuantity] = useState<string>("");
  const [note, setNote] = useState<string>("");

  // DROPDOWN STATE CONTROLS
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<string>("");

  const inventoryOptions = [
    "Coffee Beans (kg)",
    "Full Milk (carton)",
    "Croissant (pieces)",
    "Matcha Powder (g)"
  ];

  return (
    <ScrollView 
      style={{ flex: 1 }} 
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
      className="bg-background px-6 pt-20"
    >
      {/* Top Branding Section */}
      <View className="mb-6">
        <Text className="text-4xl text-neutral-800 font-heading pb-2 border-b border-neutral-400">
          Cafe Uno
        </Text>
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
            <Text className={`font-body ${selectedItem ? "text-neutral-900" : "text-neutral-500"}`}>
              {selectedItem || "Select item..."}
            </Text>
            <Text className="text-xs text-neutral-500 font-body">
              {isDropdownOpen ? "▲" : "▼"}
            </Text>
          </TouchableOpacity>

          {isDropdownOpen && (
            <View className="w-full bg-white border border-neutral-300 rounded-xl mt-1 overflow-hidden shadow-md">
              {inventoryOptions.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    setSelectedItem(item);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full py-3 px-4 border-b border-neutral-100 active:bg-neutral-50"
                >
                  <Text className="text-sm text-neutral-800 font-body">
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
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
              onPress={() => setSelectedType("Correct")}
              hitSlop={10}
              style={{
                flex: 1,
                minHeight: 48,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: selectedType === "Correct" ? "#F5F5F4" : "#FFFFFF",
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
            Quantity Received
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

        {/* Note Input with Focused Blue Stroke Accent styling */}
        <View>
          <Text className="text-sm font-bodyBold text-neutral-900 mb-1.5">Note</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Add additional notes..."
            placeholderTextColor="#A3A3A3"
            className="w-full h-10 bg-white rounded-xl px-4 text-neutral-900 font-body"
          />
        </View>

        <TouchableOpacity
          onPress={() => {
            // Placeholder action for the restock submission flow
            router.replace("/owner-dash");
          }}
          className="w-full h-12 bg-accent rounded-xl items-center justify-center"
        >
          <Text className="text-white font-bodyBold text-sm">Restock Now</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Activities Section */}
      <Text className="text-lg font-bodyBold text-neutral-900 mb-4">Recent Activities</Text>
      
      <View className="gap-y-4">
        <View className="flex-row items-center gap-x-3 pb-3 border-b border-neutral-300">
          <View className="w-10 h-10 rounded-full bg-neutral-300/60 justify-center items-center">
            <Text className="text-lg">🛒</Text>
          </View>
          <View className="flex-1">
            <Text className="text-md text-neutral-900 font-body">
              <Text className="font-bodyBold">Maria Sold 1x</Text> Croissant and <Text className="font-bodyBold">3x</Text> Dirty Matcha
            </Text>
            <Text className="text-sm text-neutral-400 font-body mt-0.5">4:09PM</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-x-3 pb-3 border-b border-neutral-300">
          <View className="w-10 h-10 rounded-full bg-neutral-300/60 justify-center items-center">
            <Text className="text-lg">🧺</Text>
          </View>
          <View className="flex-1">
            <Text className="text-md text-neutral-900 font-body">
              <Text className="font-bodyBold">Tomas Restock</Text> the Uncooked Croissant <Text className="text-green-600 font-bodyBold">+50</Text>
            </Text>
            <Text className="text-sm text-neutral-400 font-body mt-0.5">10:00AM</Text>
          </View>
        </View>
      </View>

      {/* Context Safe Back Action Redirect Hook */}
      <TouchableOpacity 
        onPress={() => router.replace("/owner-dash")}
        className="mt-8 self-center"
      >
        <Text className="text-sm text-neutral-400 font-bodySemiBold underline">
          Back to Dashboard
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
