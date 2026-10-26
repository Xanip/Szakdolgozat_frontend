import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { cn } from "cn";

type KpiCardProps = {
  title: string;
  description?: string;
  value: number | string | null;
  highlight?: boolean;
  className?: string;
};

export function KpiCard({ title, description, value, highlight = false, className }: KpiCardProps) {
  return (
    <Card className={cn("kpi-card", highlight && "kpi-card-highlight", className)}>
      <CardHeader className="justify-items-center text-center">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>

      <CardContent className="mt-auto text-center">
        <span className={cn("font-semibold tabular-nums", highlight ? "text-3xl text-primary" : "text-2xl")}>
          {value ?? "–"}
        </span>
      </CardContent>
    </Card>
  );
}
