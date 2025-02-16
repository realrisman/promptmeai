import { create } from "zustand";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { useAuthStore } from "./useAuthStore";
import { db } from "@/firebase/firebaseClient";

export interface ProfileType {
  email: string;
  contactEmail: string;
  displayName: string;
  photoUrl: string;
  emailVerified: boolean;
  credits: number;
}

const defaultProfile: ProfileType = {
  email: "",
  contactEmail: "",
  displayName: "",
  photoUrl: "",
  emailVerified: false,
  credits: 0,
};

interface ProfileState {
  profile: ProfileType;
  fetchProfile: () => void;
  updateProfile: (newProfile: Partial<ProfileType>) => Promise<void>;
  useCredits: (amount: number) => Promise<boolean>;
  addCredits: (amount: number) => Promise<void>;
}

const useProfileStore = create<ProfileState>((set, get) => ({
  profile: defaultProfile,

  fetchProfile: async () => {
    const uid = useAuthStore.getState().uid;
    if (!uid) return;

    try {
      const userRef = doc(db, `users/${uid}/profile/userData`);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const d = docSnap.data() as ProfileType;
        console.log("Profile found:", d);

        // Ensure credits are topped up if less than 100
        const credits = d.credits && d.credits >= 100 ? d.credits : 1000;

        const newProfile = {
          ...defaultProfile,
          ...d,
          credits,
          email: useAuthStore.getState().authEmail || d.email,
          contactEmail:
            d.contactEmail || useAuthStore.getState().authEmail || "",
          displayName:
            d.displayName || useAuthStore.getState().authDisplayName || "",
          photoUrl: d.photoUrl || useAuthStore.getState().authPhotoUrl || "",
        };

        await setDoc(userRef, newProfile);
        set({ profile: newProfile });
      } else {
        const newProfile = {
          email: useAuthStore.getState().authEmail || "",
          contactEmail: "",
          displayName: useAuthStore.getState().authDisplayName || "",
          photoUrl: useAuthStore.getState().authPhotoUrl || "",
          emailVerified: useAuthStore.getState().authEmailVerified || false,
          credits: 1000,
        };
        await setDoc(userRef, newProfile);
        set({ profile: newProfile });
        console.log("No profile found. Creating new profile document.");
      }
    } catch (error) {
      console.error("Error fetching or creating profile:", error);
    }
  },

  updateProfile: async (newProfile: Partial<ProfileType>) => {
    const uid = useAuthStore.getState().uid;
    if (!uid) return;

    console.log("Updating profile:", newProfile);

    try {
      const userRef = doc(db, `users/${uid}/profile/userData`);

      set((state) => ({
        profile: { ...state.profile, ...newProfile },
      }));

      await updateDoc(userRef, { ...newProfile });
      console.log("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  },

  useCredits: async (amount: number) => {
    const uid = useAuthStore.getState().uid;
    if (!uid) return false;

    const profile = get().profile;
    if (profile.credits < amount) {
      return false;
    }

    try {
      const newCredits = profile.credits - amount;
      const userRef = doc(db, `users/${uid}/profile/userData`);

      await updateDoc(userRef, { credits: newCredits });

      set((state) => ({
        profile: { ...state.profile, credits: newCredits },
      }));

      return true;
    } catch (error) {
      console.error("Error using credits:", error);
      return false;
    }
  },

  addCredits: async (amount: number) => {
    const uid = useAuthStore.getState().uid;
    if (!uid) return;

    const profile = get().profile;
    const newCredits = profile.credits + amount;

    try {
      const userRef = doc(db, `users/${uid}/profile/userData`);

      await updateDoc(userRef, { credits: newCredits });

      set((state) => ({
        profile: { ...state.profile, credits: newCredits },
      }));
    } catch (error) {
      console.error("Error adding credits:", error);
    }
  },
}));

export default useProfileStore;
