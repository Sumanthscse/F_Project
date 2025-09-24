import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor: "blue" | "orange" | "red" | "green";
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  changeType = "neutral", 
  icon: Icon, 
  iconColor 
}: StatsCardProps) {
  const iconColorClass = {
    blue: "text-info",
    orange: "text-warning",
    red: "text-destructive", 
    green: "text-success"
  }[iconColor];

  const changeColorClass = {
    positive: "text-success",
    negative: "text-destructive",
    neutral: "text-muted-foreground"
  }[changeType];

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            {change && (
              <p className={`text-sm mt-2 ${changeColorClass}`}>
                {change}
              </p>
            )}
          </div>
          <Icon className={`h-12 w-12 ${iconColorClass}`} />
        </div>
      </CardContent>
    </Card>
  );
}