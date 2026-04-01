import { useAuth } from "@/contexts/AuthContext";
import { X, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ImpersonationBanner() {
  const { isImpersonating, impersonationTarget, stopImpersonation } = useAuth();

  if (!isImpersonating || !impersonationTarget) return null;

  return (
    <div className="bg-destructive text-destructive-foreground px-4 py-2 flex items-center justify-between text-sm sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-4 w-4" />
        <span>
          Você está vendo como <strong>{impersonationTarget.fullName}</strong> ({impersonationTarget.role})
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={stopImpersonation}
        className="text-destructive-foreground hover:bg-destructive-foreground/20 h-7 gap-1"
      >
        <X className="h-3 w-3" /> Sair da impersonação
      </Button>
    </div>
  );
}
