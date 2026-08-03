import { Fraunces_600SemiBold, useFonts } from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { View } from 'react-native';
import { ID } from 'react-native-appwrite';
import { databases } from '../services/appwrite';


import './global.css';

const DATABASE_ID = '6a694ca9001b95d71b14'; 
const PROFILES_COLLECTION_ID = 'profiles'; 

// 1. Structure blueprints for global staff profiles data arrays
export interface Profile {
  $id?: string;
  name: string;
  pin: string;
  color: string;
  role: "staff" | "owner";
}

interface ProfileContextType {
  profiles: Profile[];
  addProfile: (profile: Omit<Profile, '$id'>) => Promise<void>;
  deleteProfile: (name: string) => Promise<void>;
  updateProfile: (profileId: string, updates: Partial<Pick<Profile, 'name' | 'pin'>>) => Promise<void>;
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

  const [profiles, setProfiles] = useState<Profile[]>([]);

  // READ (Fetch Profiles)
  const fetchProfiles = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        PROFILES_COLLECTION_ID
      );

      const fetchedProfiles: Profile[] = response.documents.map((doc) => ({
        $id: doc.$id,
        name: doc.name,
        pin: doc.pin,
        color: doc.color,
        role: doc.role,
      }));

      setProfiles(fetchedProfiles);
    } catch (error) {
      console.error('Failed to fetch profiles from Appwrite:', error);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  // CREATE (Add Profile)
  const addProfile = async (newProfile: Omit<Profile, '$id'>) => {
    try {
      const doc = await databases.createDocument(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        ID.unique(),
        newProfile
      );
      setProfiles((prev) => [...prev, { ...newProfile, $id: doc.$id }]);
    } catch (error) {
      console.error('Failed to create profile:', error);
    }
  };

  // 3. Delete profile from Appwrite & local state
  const deleteProfile = async (profileId: string) => {
    const target = profiles.find((p) => p.$id === profileId);
    if (!target || !target.$id) return;
    if (target.role === 'owner') return;

    try {
      await databases.deleteDocument(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        profileId
      );
      setProfiles((prev) => prev.filter((p) => p.$id !== profileId));
    } catch (error) {
      console.error('Failed to delete profile:', error);
    }
  };

  // 4. Update profile fields
  const updateProfile = async (profileId: string, updates: Partial<Pick<Profile, 'name' | 'pin'>>) => {
    const target = profiles.find((p) => p.$id === profileId);
    if (!target || !target.$id) return;

    try {
      await databases.updateDocument(
        DATABASE_ID,
        PROFILES_COLLECTION_ID,
        profileId,
        updates
      );
      setProfiles((prev) =>
        prev.map((profile) =>
          profile.$id === profileId ? { ...profile, ...updates } : profile
        )
      );
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) await SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ProfileContext.Provider value={{ profiles, addProfile, deleteProfile, updateProfile }}>
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
