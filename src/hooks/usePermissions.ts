import { useAuth } from "@/contexts/AuthContext";

export const usePermissions = () => {
  const { userRole } = useAuth();

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
