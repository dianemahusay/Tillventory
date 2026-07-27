import { useCallback, createContext, useState, useContext } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

import './global.css';

// 1. Structure blueprints for global staff profiles data arrays
export interface Profile {
  name: string;
  pin: string;
  color: string;
}

interface ProfileContextType {
  profiles: Profile[];
  addProfile: (profile: Profile) => void;
  deleteProfile: (name: string) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function useGlobalProfiles() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error("useGlobalProfiles must be used within a RootLayout Context Provider");
  return context;
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // 2. Main reactive database tracker tracking active staff list rosters
  const [profiles, setProfiles] = useState<Profile[]>([
    { name: "Maria", pin: "1111", color: "#8C5E3C" },
    { name: "Tomas", pin: "2222", color: "#6B5B95" },
    { name: "Kate", pin: "8888", color: "#4A6449" }, // Master Owner Profile
  ]);

  const addProfile = (newProfile: Profile) => {
    setProfiles((prev) => [...prev, newProfile]);
  };

  const deleteProfile = (name: string) => {
    if (name === "Kate") return; // Safety lock gate: Owner cannot be deleted
    setProfiles((prev) => prev.filter((p) => p.name !== name));
  };

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ProfileContext.Provider value={{ profiles, addProfile, deleteProfile }}>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
      </View>
    </ProfileContext.Provider>
  );
}
