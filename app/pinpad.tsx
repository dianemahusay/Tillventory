import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { useGlobalProfiles } from "./_layout";

export default function PinPad() {
  const { username } = useLocalSearchParams();
  const currentProfile = typeof username === "string" ? username : "";
  const [pin, setPin] = useState("");
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const { profiles } = useGlobalProfiles();

  const handleNumberPress = (num: string) => {
    if (showSuccessScreen) {
      return;
    }

    setPin((prev) => {
      const nextPin = prev + num;

      if (nextPin.length < 4) {
        return nextPin;
      }

      const targetUser = profiles.find((profile) => profile.name === currentProfile);
      const expectedPin = targetUser?.pin ?? null;

      if (nextPin === expectedPin) {
        setShowSuccessScreen(true);
        return nextPin;
      }

      Alert.alert("Incorrect PIN", "Please try again.");
      return "";
    });
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleStartShift = () => {
    if (currentProfile === "Kate") {
      router.replace({
        pathname: "/owner-dash",
        params: { username: currentProfile },
      });
    } else {
      router.replace({
        pathname: "/new-sale" as never,
        params: { username: currentProfile },
      });
    }
  };

  if (showSuccessScreen) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }} className="bg-background px-6">
        <View className="items-center mb-29">
          <Text className="text-4xl font-heading mb-2">Cafe Uno</Text>
          <Text className="text-sm text-neutral-400 font-medium">Enter your Pin</Text>
        </View>

        <View className="items-center mb-16 mt-12">
          <View className="w-16 h-16 rounded-full border-4 border-[#8BC34A] justify-center items-center mb-4">
            <Text className="text-[#8BC34A] text-3xl font-bold">✓</Text>
          </View>

          <Text className="text-2xl font-bold text-neutral-900 mb-1">Signed In</Text>
          <Text className="text-base text-neutral-800 font-medium">
            Welcome back, {currentProfile || "Maria"}.
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleStartShift}
          className="w-full max-w-[240px] bg-accent py-3.5 rounded-xl items-center shadow-sm active:opacity-90"
        >
          <Text className="text-white text-base font-semibold">Start Shift</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }} className="bg-background px-6">
      <View className="items-center mb-8">
        <Text className="text-4xl text-textPrimary font-heading mb-2">Cafe Uno</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-sm text-textSecondary font-body underline">
            Not {currentProfile || "your profile"}? Switch
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row gap-3 mb-12">
        <View className={`w-3.5 h-3.5 rounded-full ${pin.length > 0 ? "bg-textPrimary" : "bg-neutral-300"}`} />
        <View className={`w-3.5 h-3.5 rounded-full ${pin.length > 1 ? "bg-textPrimary" : "bg-neutral-300"}`} />
        <View className={`w-3.5 h-3.5 rounded-full ${pin.length > 2 ? "bg-textPrimary" : "bg-neutral-300"}`} />
        <View className={`w-3.5 h-3.5 rounded-full ${pin.length > 3 ? "bg-textPrimary" : "bg-neutral-300"}`} />
      </View>

      <View className="w-full max-w-[280px] gap-y-3">
        <View className="flex-row justify-between">
          <TouchableOpacity onPress={() => handleNumberPress("1")} className="w-20 h-20 bg-white border border-neutral-800 rounded-xl justify-center items-center active:bg-neutral-100">
            <Text className="text-2xl font-bold text-neutral-900">1</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleNumberPress("2")} className="w-20 h-20 bg-white border border-neutral-800 rounded-xl justify-center items-center active:bg-neutral-100">
            <Text className="text-2xl font-bold text-neutral-900">2</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleNumberPress("3")} className="w-20 h-20 bg-white border border-neutral-800 rounded-xl justify-center items-center active:bg-neutral-100">
            <Text className="text-2xl font-bold text-neutral-900">3</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-between">
          <TouchableOpacity onPress={() => handleNumberPress("4")} className="w-20 h-20 bg-white border border-neutral-800 rounded-xl justify-center items-center active:bg-neutral-100">
            <Text className="text-2xl font-bold text-neutral-900">4</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleNumberPress("5")} className="w-20 h-20 bg-white border border-neutral-800 rounded-xl justify-center items-center active:bg-neutral-100">
            <Text className="text-2xl font-bold text-neutral-900">5</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleNumberPress("6")} className="w-20 h-20 bg-white border border-neutral-800 rounded-xl justify-center items-center active:bg-neutral-100">
            <Text className="text-2xl font-bold text-neutral-900">6</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-between">
          <TouchableOpacity onPress={() => handleNumberPress("7")} className="w-20 h-20 bg-white border border-neutral-800 rounded-xl justify-center items-center active:bg-neutral-100">
            <Text className="text-2xl font-bold text-neutral-900">7</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleNumberPress("8")} className="w-20 h-20 bg-white border border-neutral-800 rounded-xl justify-center items-center active:bg-neutral-100">
            <Text className="text-2xl font-bold text-neutral-900">8</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleNumberPress("9")} className="w-20 h-20 bg-white border border-neutral-800 rounded-xl justify-center items-center active:bg-neutral-100">
            <Text className="text-2xl font-bold text-neutral-900">9</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-between">
          <View className="w-20 h-20" />
          <TouchableOpacity onPress={() => handleNumberPress("0")} className="w-20 h-20 bg-white border border-neutral-800 rounded-xl justify-center items-center active:bg-neutral-100">
            <Text className="text-2xl font-bold text-neutral-900">0</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleBackspace} className="w-20 h-20 bg-white border border-neutral-800 rounded-xl justify-center items-center active:bg-neutral-100">
            <Text className="text-xl text-neutral-900">⌫</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
