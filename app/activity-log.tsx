import React, { useState } from "react";
import { Text, View, ScrollView, TouchableOpacity } from "react-native";
import { router } from "expo-router";

type ActivityCategory = "All" | "Drinks" | "Foods";

interface ActivityLogItem {
  id: string;
  type: "sale" | "restock";
  category: "Drinks" | "Foods" | "Both";
  text: string;
  time: string;
}

export default function ShiftActivityScreen() {
  // Tracking state for top activity filter pills
  const [activeTab, setActiveTab] = useState<ActivityCategory>("All");

  // Mock activity logs array based on your layout reference
  const activitiesData: ActivityLogItem[] = [
    {
      id: "1",
      type: "sale",
      category: "Both",
      text: "Maria Sold 1x Croissant and 3x Dirty Matcha",
      time: "4:09PM",
    },
    {
      id: "2",
      type: "restock",
      category: "Foods",
      text: "Tomas Restock the Uncooked Croissant +50",
      time: "10:00AM",
    },
    {
      id: "3",
      type: "sale",
      category: "Both",
      text: "Maria Sold 1x Croissant and 3x Dirty Matcha",
      time: "4:09PM",
    },
    {
      id: "4",
      type: "sale",
      category: "Both",
      text: "Maria Sold 1x Croissant and 3x Dirty Matcha",
      time: "4:09PM",
    },
  ];

  // Logic to dynamically filter items based on your category choice
  const filteredActivities = activitiesData.filter((item) => {
    if (activeTab === "All") return true;
    return item.category === activeTab || item.category === "Both";
  });

  return (
    <View style={{ flex: 1 }} className="bg-background pt-16">
      {/* Top Branding Section Layout Banner */}
      <View className="px-6 mb-4">
        <Text className="text-4xl text-textPrimary font-heading pb-2 border-b border-neutral-400 mt-4">
          Cafe Uno
        </Text>
      </View>

      {/* Horizontal Category Pill Filter Blocks */}
      <View className="flex-row gap-x-2 px-6 mb-8">
        {(["All", "Drinks", "Foods"] as const).map((tabName) => {
          const isSelected = activeTab === tabName;
          return (
            <TouchableOpacity
              key={tabName}
              onPress={() => setActiveTab(tabName)}
              className={`border border-neutral-900 rounded-full px-5 py-1.5 ${
                isSelected ? "bg-neutral-900" : "bg-white"
              }`}
            >
              <Text 
                className={`text-md font-bodySemiBold ${
                  isSelected ? "text-white" : "text-neutral-900"
                }`}
              >
                {tabName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Timeline Activities Content Feed List */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }} className="flex-1">
        <View className="w-full">
          {filteredActivities.map((item) => (
            <View 
              key={item.id} 
              className="flex-row items-center gap-x-3 py-4 border-b border-neutral-300"
            >
              {/* Circular Avatar Icon Badge Wrapper */}
              <View className="w-11 h-11 rounded-full bg-neutral-200 justify-center items-center">
                <Text className="text-xl">
                  {item.type === "sale" ? "🛒" : "🧺"}
                </Text>
              </View>

              {/* Text Description Content Block */}
              <View className="flex-1 pr-2">
                <Text className="text-md text-neutral-900 font-bodyBold leading-snug">
                  {item.text}
                </Text>
                <Text className="text-sm text-neutral-400 font-body mt-0.5">
                  {item.time}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Action Link Close button to return back to previous dashboard window */}
        <TouchableOpacity 
          onPress={() => router.back()}
          className="mt-12 self-center"
        >
          <Text className="text-sm text-neutral-400 font-bodySemiBold underline">
            Close Activity Log
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}