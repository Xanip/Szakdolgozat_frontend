import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "cn";

export type DateRangeValue = {
  from: string | null;
  to: string | null;
};

type CalendarDateRangePickerProps = {
  /** Fires only once both the start and end dates are selected. */
  onChange: (value: DateRangeValue) => void;
  value?: DateRangeValue | null;
  placeholder?: string;
  className?: string;
};

/** Converts a Date to a YYYY-MM-DD string (matches the other filter pickers). */
function toISODate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** Parses a YYYY-MM-DD string into a local Date, or undefined when empty. */
function fromISODate(value?: string | null): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

/**
 * Date range filter built on the shadcn Calendar (ui/calendar) in range mode,
 * opened from a popover trigger. The onChange callback runs only when both
 * ends of the range are picked, emitting YYYY-MM-DD strings to stay consistent
 * with FromTodayDatePicker.
 */
export function CalendarDateRangePicker({
  onChange,
  value,
  placeholder = "Pick a date range",
  className,
}: CalendarDateRangePickerProps) {
  const [range, setRange] = useState<DateRange | undefined>(() => ({
    from: fromISODate(value?.from),
    to: fromISODate(value?.to),
  }));

  const handleSelect = (next: DateRange | undefined) => {
    setRange(next);

    // Only emit once both ends are chosen.
    if (next?.from && next?.to) {
      onChange({ from: toISODate(next.from), to: toISODate(next.to) });
    }
  };

  const label =
    range?.from && range?.to
      ? `${format(range.from, "yyyy. MM. dd")} – ${format(range.to, "yyyy. MM. dd")}`
      : range?.from
      ? `${format(range.from, "yyyy. MM. dd")} – …`
      : placeholder;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn(
              "w-64 justify-center gap-2 font-normal",
              !range?.from && "text-muted-foreground",
              className
            )}
            aria-label="Select date range"
          >
            <CalendarIcon aria-hidden="true" />
            <span className="truncate">{label}</span>
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={range}
          onSelect={handleSelect}
          numberOfMonths={2}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
