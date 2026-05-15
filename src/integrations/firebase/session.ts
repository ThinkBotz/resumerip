import { useEffect, useState } from "react";
import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getFirebaseServices, isFirebaseConfigured } from "./client";

export type PersonalizationProfile = {
  targetRole: string;
  preferredTone: string;
  githubUsername: string;
  notes: string;
  updatedAt?: number;
};

export const defaultPersonalizationProfile: PersonalizationProfile = {
  targetRole: "",
  preferredTone: "Professional",
  githubUsername: "",
  notes: "",
  updatedAt: undefined,
};

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const services = getFirebaseServices();
    if (!services) {
      setError("Firebase is not configured. Add VITE_FIREBASE_* env vars to enable login.");
      setLoading(false);
      return;
    }

    let active = true;

    void setPersistence(services.auth, browserLocalPersistence).catch((err: unknown) => {
      console.error("Failed to set Firebase auth persistence:", err);
    });

    const unsubscribe = onAuthStateChanged(services.auth, (nextUser) => {
      if (!active) return;
      setUser(nextUser);
      setLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    const services = getFirebaseServices();
    if (!services) {
      throw new Error("Firebase is not configured.");
    }
    return signInWithPopup(services.auth, services.googleProvider);
  };

  const signOut = async () => {
    const services = getFirebaseServices();
    if (!services) {
      return;
    }
    await firebaseSignOut(services.auth);
  };

  return {
    user,
    loading,
    error,
    isConfigured: isFirebaseConfigured(),
    signInWithGoogle,
    signOut,
  };
}

export function usePersonalizationProfile(uid: string | null) {
  const [profile, setProfile] = useState<PersonalizationProfile>(defaultPersonalizationProfile);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setProfile(defaultPersonalizationProfile);
      setLoading(false);
      setError(null);
      return;
    }

    const services = getFirebaseServices();
    if (!services) {
      setError("Firebase is not configured.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const snapshot = await getDoc(doc(services.db, "userProfiles", uid));
        if (cancelled) return;

        if (snapshot.exists()) {
          const data = snapshot.data() as Partial<PersonalizationProfile>;
          setProfile({
            targetRole: data.targetRole ?? "",
            preferredTone: data.preferredTone ?? "Professional",
            githubUsername: data.githubUsername ?? "",
            notes: data.notes ?? "",
            updatedAt: data.updatedAt,
          });
        } else {
          setProfile(defaultPersonalizationProfile);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load personalization profile.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  const saveProfile = async (nextProfile: PersonalizationProfile = profile) => {
    if (!uid) {
      throw new Error("Login required to save personalization.");
    }

    const services = getFirebaseServices();
    if (!services) {
      throw new Error("Firebase is not configured.");
    }

    setSaving(true);
    try {
      const normalizedProfile: PersonalizationProfile = {
        ...nextProfile,
        githubUsername: nextProfile.githubUsername.trim(),
        targetRole: nextProfile.targetRole.trim(),
        preferredTone: nextProfile.preferredTone.trim() || "Professional",
        notes: nextProfile.notes.trim(),
        updatedAt: Date.now(),
      };

      await setDoc(doc(services.db, "userProfiles", uid), normalizedProfile, { merge: true });
      setProfile(normalizedProfile);
    } finally {
      setSaving(false);
    }
  };

  return {
    profile,
    setProfile,
    loading,
    saving,
    error,
    saveProfile,
  };
}