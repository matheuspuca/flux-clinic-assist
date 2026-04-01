import { useAuth } from "@/contexts/AuthContext";

export const usePermissions = () => {
  const { userRole, isSuperAdmin } = useAuth();

  // Superadmin has all permissions
  if (isSuperAdmin) {
    return {
      canManageUsers: true,
      canManageServices: true,
      canManageProfessionals: true,
      canViewFinancial: true,
      canCreateAppointments: true,
      canCancelAppointments: true,
      canCompleteAppointments: true,
      canViewAllAppointments: true,
      canManageClinicSettings: true,
      canViewPatients: true,
      canViewInventory: true,
      isAdmin: true,
      isProfessional: false,
      isAtendente: false,
    };
  }

  return {
    canManageUsers: userRole === "admin",
    canManageServices: userRole === "admin",
    canManageProfessionals: userRole === "admin",
    canViewFinancial: userRole === "admin",
    canCreateAppointments: userRole === "admin" || userRole === "atendente",
    canCancelAppointments: userRole === "admin" || userRole === "atendente",
    canCompleteAppointments: userRole === "admin" || userRole === "profissional",
    canViewAllAppointments: userRole === "admin" || userRole === "atendente",
    canManageClinicSettings: userRole === "admin",
    canViewPatients: userRole === "admin" || userRole === "atendente",
    canViewInventory: userRole === "admin",
    isAdmin: userRole === "admin",
    isProfessional: userRole === "profissional",
    isAtendente: userRole === "atendente",
  };
};
