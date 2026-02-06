import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BIChartProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export function BIChart({ title, subtitle, icon: Icon, children, className, actions }: BIChartProps) {
  return (
    <Card className={cn("chart-container", className)}>
      <CardHeader className="pb-2 px-3 md:px-6 pt-3 md:pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5 md:space-y-1 min-w-0 flex-1">
            <CardTitle className="text-sm md:text-base font-semibold flex items-center gap-1.5 md:gap-2 truncate">
              {Icon && <Icon className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary flex-shrink-0" />}
              <span className="truncate">{title}</span>
            </CardTitle>
            {subtitle && (
              <p className="text-[10px] md:text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
        </div>
      </CardHeader>
      <CardContent className="pt-2 px-2 md:px-6 pb-3 md:pb-6">{children}</CardContent>
    </Card>
  );
}
