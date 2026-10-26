import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

type KpiCardProps = {
  title: string;
  description?: string;
  value: number | string | null;
};

export function KpiCard({ title, description, value }: KpiCardProps) {
  return (
    <Card className="w-56">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>

      <CardContent>
        <span className="text-2xl font-semibold">
          {value ?? "–"}
        </span>
      </CardContent>
    </Card>
  );
}