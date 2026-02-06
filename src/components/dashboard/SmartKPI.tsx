import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface SmartKPIProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  insight?: string;
  format?: "number" | "currency" | "percent";
}

export function SmartKPI({
  title,
  value,
  change,
  changeLabel = "vs mês anterior",
  icon: Icon,
  trend = "neutral",
  insight,
  format = "number",
}: SmartKPIProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === "string") return val;
    if (format === "currency") {
      return `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
    }
    if (format === "percent") {
      return `${val}%`;
    }
    return val.toLocaleString("pt-BR");
  };

  const getTrendIcon = () => {
    if (trend === "up") return TrendingUp;
    if (trend === "down") return TrendingDown;
    return Minus;
  };

  const TrendIcon = getTrendIcon();

  return (
    <div className="kpi-card group relative overflow-hidden">
      {/* Background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-2 md:mb-3">
          <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-4 w-4 md:h-5 md:w-5 text-primary" />
          </div>
          {change !== undefined && (
            <div
              className={cn(
                "flex items-center gap-1 px-1.5 md:px-2 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-medium",
                trend === "up" && "bg-kpi-positive/10 text-kpi-positive",
                trend === "down" && "bg-kpi-negative/10 text-kpi-negative",
                trend === "neutral" && "bg-muted text-muted-foreground"
              )}
            >
              <TrendIcon className="h-2.5 w-2.5 md:h-3 md:w-3" />
              <span>{change > 0 ? "+" : ""}{change}%</span>
            </div>
          )}
        </div>
        
        <div className="space-y-0.5 md:space-y-1">
          <p className="text-xs md:text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="text-lg md:text-2xl font-bold text-foreground tracking-tight truncate">
            {formatValue(value)}
          </p>
          {changeLabel && change !== undefined && (
            <p className="text-[10px] md:text-xs text-muted-foreground truncate">{changeLabel}</p>
          )}
        </div>

        {insight && (
          <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-border">
            <p className="text-[10px] md:text-xs text-muted-foreground leading-relaxed line-clamp-2">
              💡 {insight}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
