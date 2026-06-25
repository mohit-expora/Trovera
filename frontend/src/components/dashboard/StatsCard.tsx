import * as React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@trovera/ui";

interface TrendProps {
  value: number;
  label: string;
}

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  trend?: TrendProps;
  gradient?: "purple" | "blue" | "pink" | "success";
}

// Card gradient backgrounds — all use CSS vars so they update with the palette
const gradientClasses: Record<string, string> = {
  purple:  "bg-pastel-purple",
  blue:    "bg-pastel-blue",
  pink:    "bg-pastel-pink",
  success: "bg-pastel-success",
};

// Icon container gradient per card type
const iconContainerClasses: Record<string, string> = {
  purple:  "bg-gradient-to-br from-primary/30 to-primary/10 text-primary",
  blue:    "bg-gradient-to-br from-secondary/35 to-secondary/10 text-primary",
  pink:    "bg-gradient-to-br from-accent/35 to-accent/10 text-primary",
  success: "bg-gradient-to-br from-success/35 to-success/10 text-success",
};

// Subtle card border tint per type
const borderClasses: Record<string, string> = {
  purple:  "border-primary/20",
  blue:    "border-secondary/25",
  pink:    "border-accent/25",
  success: "border-success/25",
};

export function StatsCard({ title, value, icon: Icon, description, trend, gradient }: StatsCardProps) {
  const isPositiveTrend = trend && trend.value >= 0;

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-200 hover:-translate-y-0.5",
        "shadow-pastel-lg",
        gradient ? gradientClasses[gradient] : "bg-card",
        gradient ? borderClasses[gradient] : "border-border",
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            <p className="text-3xl font-bold tracking-tight text-foreground leading-none">
              {value}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  isPositiveTrend ? "text-success" : "text-destructive"
                )}
              >
                {isPositiveTrend ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                <span>{isPositiveTrend ? "+" : ""}{trend.value}% {trend.label}</span>
              </div>
            )}
          </div>

          {/* Gradient icon container */}
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm",
              gradient ? iconContainerClasses[gradient] : "bg-primary/15 text-primary"
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
