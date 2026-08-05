import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { CombinedActivityLog, fetchCombinedActivities } from "../services/activityUtils";

type ActivityCategory = "All" | "Drinks" | "Foods";

export default function ShiftActivityScreen() {
  const [activeTab, setActiveTab] = useState<ActivityCategory>("All");
  const [logs, setLogs] = useState<CombinedActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useEffect(() => {
    loadActivityLogs();
  }, []);

  const loadActivityLogs = async () => {
    try {
      setIsLoading(true);
      // Fetches using shared utility (filters out raw recipe deductions automatically)
      const data = await fetchCombinedActivities({ limit: 100 });
      setLogs(data);
    } catch (error) {
      console.error("Failed to fetch activity logs:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadActivityLogs();
  }, []);

  const filteredActivities = logs.filter((log) => {
    if (activeTab === "All") return true;
    return log.category === activeTab;
  });

  return (
    <View style={{ flex: 1 }} className="bg-background pt-16">
      {/* Top Branding Section */}
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
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }}
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="w-full">
          {isLoading ? (
            <ActivityIndicator color="#171717" size="large" className="py-8" />
          ) : filteredActivities.length === 0 ? (
            <Text className="text-center text-neutral-400 font-body py-8">
              No sales or restock activities found.
            </Text>
          ) : (
            filteredActivities.map((activity) => (
              <View
                key={activity.id}
                className="flex-row items-center gap-x-3 py-4 border-b border-neutral-300"
              >
                {/* Circular Avatar Icon Badge */}
                <View className="w-11 h-11 rounded-full bg-neutral-200 justify-center items-center">
                  <Text className="text-xl">{activity.icon}</Text>
                </View>

                {/* Text Description Content Block */}
                <View className="flex-1 pr-2">
                  <Text className="text-md text-neutral-900 font-body leading-snug">
                    <Text className="font-bodyBold">
                      {activity.title}
                    </Text>
                  </Text>

                  <Text className="text-sm text-neutral-400 font-body mt-0.5">
                    {activity.time}
                  </Text>
                </View>
              </View>
            ))  
          )}
        </View>

        {/* Action Link Close Button */}
        <TouchableOpacity 
          onPress={() => router.replace("/new-sale")}
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