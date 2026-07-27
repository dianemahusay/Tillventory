import { router } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useGlobalProfiles } from "./_layout"; // Import shared memory link hook

export default function Index() {
  const { profiles } = useGlobalProfiles(); // Extract live database state entries

  const handleProfilePress = (name: string) => {
    router.push({ pathname: "/pinpad", params: { username: name } });
  };

  return (
    <View style={{ flex: 1 }} className="bg-background px-4">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingTop: 24,
          paddingBottom: 32,
        }}
        className="w-full"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center justify-center mb-6">
          <Text className="text-3xl font-bold text-textPrimary border-accent pb-1 font-heading text-center">
            Welcome to Cafe Uno
          </Text>
          <Text className="text-base text-textSecondary font-body mt-2 text-center mb-9">
            Who's on shift today?
          </Text>
        </View>

        <View className="w-full max-w-xs items-center">
          <View className="flex-row flex-wrap justify-center gap-5">
            {profiles.map((profile) => (
              <TouchableOpacity
                key={profile.name}
                onPress={() => handleProfilePress(profile.name)}
                style={{ backgroundColor: profile.color, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 }}
                className="w-[130px] h-[130px] rounded-[24px] justify-center items-center active:opacity-80"
              >
                <Text className="text-white text-xl font-bodyBold">{profile.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
