import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

type AppRole = "admin" | "profissional" | "atendente";

interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  clinic_id: string;
}

interface Clinic {
  id: string;
  name: string;
  area: string;
  cnpj: string | null;
  timezone: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  userRole: AppRole | null;
  clinic: Clinic | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      setProfile(profileData);

      // Fetch role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      setUserRole(roleData?.role ?? null);

      // Fetch clinic
      if (profileData?.clinic_id) {
        const { data: clinicData } = await supabase
          .from("clinics")
          .select("*")
          .eq("id", profileData.clinic_id)
          .maybeSingle();

        setClinic(clinicData);
      } else {
        setClinic(null);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          // Use setTimeout to avoid Supabase auth deadlock
          setTimeout(() => fetchUserData(currentUser.id), 0);
        } else {
          setProfile(null);
          setUserRole(null);
          setClinic(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchUserData(currentUser.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setUserRole(null);
    setClinic(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, userRole, clinic, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
