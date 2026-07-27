import { router } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useGlobalProfiles } from "./_layout";

export default function ManageProfilesScreen() {
  const { profiles, addProfile, deleteProfile } = useGlobalProfiles();

  // Local state inputs for constructing brand new staff entries
  const [newName, setNewName] = useState("");
  const [newPin, setNewPin] = useState("");
  
  // Available color choices for new profile cards
  const colorPalette = ["#8C5E3C", "#6B5B95", "#3B5998", "#D9534F", "#F0AD4E"];
  const [selectedColor, setSelectedColor] = useState("#3B5998");

  const handleCreateProfile = () => {
    if (!newName || newPin.length !== 4) {
      alert("Please provide a valid employee name and a 4-digit passcode PIN.");
      return;
    }

    addProfile({
      name: newName,
      pin: newPin,
      color: selectedColor,
    });

    // Reset input fields on success closure
    setNewName("");
    setNewPin("");
    alert(`${newName} successfully added to the staff login list!`);
  };

  return (
    <View style={{ flex: 1 }} className="bg-background pt-20">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 360 }}>
        {/* Top Header Section */}
        <View className="mb-6">
          <Text className="text-4xl font-heading pb-2 border-b border-neutral-400">Cafe Uno</Text>
        </View>

        <Text className="text-lg font-bodyBold text-neutral-900 mb-4">Active Staff Profiles</Text>

        {/* Dynamic Staff Profile Cards Roster Feed List */}
        <View className="gap-y-3 mb-8">
          {profiles.map((profile) => (
            <View 
              key={profile.name} 
              className="w-full bg-white border border-neutral-200 p-4 rounded-xl flex-row justify-between items-center shadow-sm"
            >
              <View className="flex-row items-center gap-x-3">
                {/* Visual Color Thumbnail Chip Indicator */}
                <View style={{ backgroundColor: profile.color }} className="w-5 h-5 rounded-full" />
                <View>
                  <Text className="text-base font-bodyBold text-neutral-900">{profile.name}</Text>
                  <Text className="text-xs font-body text-neutral-400">Passcode PIN: ****</Text>
                </View>
              </View>

              {/* Trash/Delete Option (Safely hides button on master owner file) */}
              {profile.name !== "Kate" ? (
                <TouchableOpacity 
                  onPress={() => deleteProfile(profile.name)}
                  className="px-3 py-2 bg-red-50 rounded-lg active:opacity-60"
                >
                  <Text className="text-red-600 text-sm font-bodyBold">Remove 🗑️</Text>
                </TouchableOpacity>
              ) : (
                <Text className="text-xs font-body text-neutral-400 italic px-2">Master Owner</Text>
              )}
            </View>
          ))}
        </View>

        {/* Back Navigation Return Trigger link */}
        <TouchableOpacity onPress={() => router.replace("/owner-dash")} className="self-center">
          <Text className="text-sm text-neutral-400 font-bodySemiBold underline">Back to Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* PERSISTENT LOWER CONSOLE FORM PANEL: Create New Staff Profiles */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="absolute bottom-0 left-0 right-0">
        <View className="bg-neutral-200/95 rounded-t-[38px] p-8 pb-10 border-t border-t-neutral-300 shadow-lg">
          <Text className="text-base text-neutral-900 font-bodyBold mb-4">Register New Employee Card</Text>
          
          <View className="gap-y-3.5 mb-6">
            {/* Input Name Block */}
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Employee Name"
              placeholderTextColor="#737373"
              className="w-full h-11 bg-white border border-neutral-300 rounded-xl px-3 text-md font-body text-neutral-800"
            />

            {/* Input PIN Block */}
            <TextInput
              keyboardType="numeric"
              maxLength={4}
              value={newPin}
              onChangeText={setNewPin}
              placeholder="Enter 4-Digit PIN"
              placeholderTextColor="#737373"
              className="w-full h-11 bg-white border border-neutral-300 rounded-xl px-3 text-md font-body text-neutral-800"
            />

            {/* Optional Card Color Selector Track */}
            <View className="flex-row items-center gap-x-3 mt-1">
              <Text className="text-xs font-bodyBold text-neutral-600">Card Color:</Text>
              <View className="flex-row gap-x-3">
                {colorPalette.map((color) => {
                  const isSelected = selectedColor === color;

                  return (
                    <TouchableOpacity
                      key={color}
                      onPress={() => setSelectedColor(color)}
                      style={{
                        backgroundColor: color,
                        borderWidth: 2,
                        borderColor: isSelected ? "#171717" : "transparent",
                        transform: isSelected ? [{ scale: 1.1 }] : [{ scale: 1 }],
                      }}
                      className="w-7 h-7 rounded-full"
                    />
                  );
                })}
              </View>
            </View>
          </View>

          {/* Core Creation Submission Trigger button */}
          <TouchableOpacity 
            onPress={handleCreateProfile}
            className="w-full bg-accent py-3.5 rounded-xl items-center shadow-sm active:opacity-95"
          >
            <Text className="text-white text-md font-bodyBold">+ Add Staff Profile</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
