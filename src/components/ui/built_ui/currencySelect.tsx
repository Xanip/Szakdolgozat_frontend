import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useDimensionData } from "@/hooks/api/useDimensionData";

type CurrencySelectProps = {
    value: string|null;
    onChange: (value: string | null) => void;
  placeholder?: string,
};

export function CurrencySelect({value, onChange, placeholder = "select currency"}: CurrencySelectProps) {
  const { data, isPending, isError } = useDimensionData();

  const items = (data?.currencies ?? []).map((c) => ({
    value: c.code,
    label: c.name ? `${c.code} - ${c.name}` : c.code,
  }));

  return (
    <Select items={items} value={value} onValueChange={onChange} disabled={isPending || isError} >
      <SelectTrigger className="w-64">
        <SelectValue placeholder={
            isPending? "Loading currencies...": isError? "Could not load currencies": placeholder
          } />
      </SelectTrigger>

      <SelectContent>
        {items.map((item) => (
          <SelectItem
            key={item.value}
            value={item.value}
          >
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
