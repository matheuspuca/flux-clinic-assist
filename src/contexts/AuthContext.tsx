import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
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

interface ImpersonationTarget {
  userId: string;
  fullName: string;
  clinicId: string;
  role: AppRole;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  userRole: AppRole | null;
  clinic: Clinic | null;
  loading: boolean;
  isSuperAdmin: boolean;
  // Impersonation
  isImpersonating: boolean;
  impersonationTarget: ImpersonationTarget | null;
  startImpersonation: (target: ImpersonationTarget) => void;
  stopImpersonation: () => void;
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
  const [realProfile, setRealProfile] = useState<Profile | null>(null);
  const [realRole, setRealRole] = useState<AppRole | null>(null);
  const [realClinic, setRealClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Impersonation state
  const [impersonationTarget, setImpersonationTarget] = useState<ImpersonationTarget | null>(null);
  const [impersonatedProfile, setImpersonatedProfile] = useState<Profile | null>(null);
  const [impersonatedClinic, setImpersonatedClinic] = useState<Clinic | null>(null);

  const isImpersonating = !!impersonationTarget;

  // Effective values (impersonated or real)
  const profile = isImpersonating ? impersonatedProfile : realProfile;
  const userRole = isImpersonating ? impersonationTarget?.role ?? null : realRole;
  const clinic = isImpersonating ? impersonatedClinic : realClinic;

  const provisionNewUser = async (userId: string, metadata: Record<string, any>) => {
    try {
      const clinicName = metadata.clinic_name;
      const clinicArea = metadata.clinic_area;
      const fullName = metadata.full_name || "Usuário";

      if (!clinicName || !clinicArea) return false;

      // Create clinic
      const { data: clinicData, error: clinicError } = await supabase
        .from("clinics")
        .insert({ name: clinicName, area: clinicArea, cnpj: metadata.clinic_cnpj || null })
        .select("id")
        .single();
      if (clinicError) throw clinicError;

      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        full_name: fullName,
        clinic_id: clinicData.id,
        phone: metadata.phone || null,
      });
      if (profileError) throw profileError;

      // Assign admin role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: "admin",
      });
      if (roleError) throw roleError;

      return true;
    } catch (error) {
      console.error("Error provisioning new user:", error);
      return false;
    }
  };

  const fetchUserData = async (userId: string) => {
    setProfileLoaded(false);
    try {
      let { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      // If no profile exists, try to auto-provision from user metadata
      if (!profileData) {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        const metadata = currentUser?.user_metadata;
        if (metadata?.clinic_name) {
          const provisioned = await provisionNewUser(userId, metadata);
          if (provisioned) {
            const { data: newProfile } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", userId)
              .maybeSingle();
            profileData = newProfile;
          }
        }
      }

      setRealProfile(profileData);

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      setRealRole(roleData?.role ?? null);

      if (profileData?.clinic_id) {
        const { data: clinicData } = await supabase
          .from("clinics")
          .select("*")
          .eq("id", profileData.clinic_id)
          .maybeSingle();

        setRealClinic(clinicData);
      } else {
        setRealClinic(null);
      }

      // Check superadmin
      const { data: saData } = await supabase.rpc("is_superadmin", { _user_id: userId });
      setIsSuperAdmin(!!saData);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const startImpersonation = useCallback(async (target: ImpersonationTarget) => {
    // Fetch the target user's profile
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", target.userId)
      .maybeSingle();

    const { data: targetClinic } = await supabase
      .from("clinics")
      .select("*")
      .eq("id", target.clinicId)
      .maybeSingle();

    setImpersonatedProfile(targetProfile);
    setImpersonatedClinic(targetClinic);
    setImpersonationTarget(target);
  }, []);

  const stopImpersonation = useCallback(() => {
    setImpersonationTarget(null);
    setImpersonatedProfile(null);
    setImpersonatedClinic(null);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          setTimeout(() => fetchUserData(currentUser.id), 0);
        } else {
          setRealProfile(null);
          setRealRole(null);
          setRealClinic(null);
          setIsSuperAdmin(false);
          stopImpersonation();
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
    stopImpersonation();
    await supabase.auth.signOut();
    setUser(null);
    setRealProfile(null);
    setRealRole(null);
    setRealClinic(null);
    setIsSuperAdmin(false);
  };

  return (
    <AuthContext.Provider value={{
      user, profile, userRole, clinic, loading, isSuperAdmin,
      isImpersonating, impersonationTarget,
      startImpersonation, stopImpersonation, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
