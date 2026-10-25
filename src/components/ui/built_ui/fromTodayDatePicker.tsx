import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState } from "react";

type FromTodayDatePickerProps = {
    onChange: (value: string | null) => void;
};

type Unit = "day" | "week" | "month" | "year";

const UNITS: { value: Unit; label: string }[] = [
  { value: "day", label: "day" },
  { value: "week", label: "week" },
  { value: "month", label: "month" },
  { value: "year", label: "year" },
];

function toStartDate(amount: number, unit: Unit): string {
  const d = new Date();
  if (unit === "day") d.setDate(d.getDate() - amount);
  if (unit === "week") d.setDate(d.getDate() - amount * 7);
  if (unit === "month") d.setMonth(d.getMonth() - amount);
  if (unit === "year") d.setFullYear(d.getFullYear() - amount);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}


export function FromTodayDatePicker({onChange,}: FromTodayDatePickerProps) {
    const [amount, setAmount] = useState<number|null>(null);
    const [unit, setUnit] = useState<Unit>("day");

    const emit = (nextAmount: number | null, nextUnit: Unit) => {
        if (nextAmount === null || nextAmount <= 0) {
            onChange(null);
        } else {
            onChange(toStartDate(nextAmount, nextUnit));
        }
    };

    return (
        <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Previous</span>

        <Input
            type="number"
            min={1}
            className="w-20"
            value={amount ?? ""}
            onChange={(e) => {
            const n = e.target.value === "" ? null : Number(e.target.value);
            setAmount(n);
            emit(n, unit);
            }}
        />

        <Select
            value={unit}
            onValueChange={(u) => {
            const nextUnit = (u ?? "day") as Unit;
            setUnit(nextUnit);
            emit(amount, nextUnit);
            }}
        >
            <SelectTrigger className="w-32">
            <SelectValue placeholder="egység" />
            </SelectTrigger>
            <SelectContent>
            {UNITS.map((u) => (
                <SelectItem key={u.value} value={u.value}>
                {u.label}
                </SelectItem>
            ))}
            </SelectContent>
        </Select>
        </div>
    );
}