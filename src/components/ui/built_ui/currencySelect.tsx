import { SearchIcon } from "lucide-react";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import { InputGroupAddon } from "@/components/ui/input-group";
import { useDimensionData } from "@/hooks/api/useDimensionData";

type CurrencySelectProps = {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
};

type CurrencyItem = { value: string; label: string };

/**
 * Searchable currency picker built on the shadcn Combobox (ui/combobox).
 * The list opens like a select; typing into the search field at the top of
 * the popup filters the currencies by code or name ("USD" leaves only
 * the US Dollar).
 */
export function CurrencySelect({ value, onChange, placeholder = "select currency" }: CurrencySelectProps) {
  const { data, isPending, isError } = useDimensionData();

  const items: CurrencyItem[] = (data?.currencies ?? []).map((c) => ({
    value: c.code,
    label: c.name ? `${c.code} - ${c.name}` : c.code,
  }));

  // Combobox works with item objects
  const selectedItem = items.find((item) => item.value === value) ?? null;

  return (
    <Combobox
      items={items}
      value={selectedItem}
      onValueChange={(item) => onChange(item?.value ?? null)}
      isItemEqualToValue={(a, b) => a.value === b.value}
      disabled={isPending || isError}
      autoHighlight
    >
      <ComboboxTrigger className="currency-trigger w-64">
        <ComboboxValue
          placeholder={isPending ? "Loading currencies..." : isError ? "Could not load currencies" : placeholder}
        >
          {(item: CurrencyItem | null) => <span className="truncate">{item?.label}</span>}
        </ComboboxValue>
      </ComboboxTrigger>

      <ComboboxContent>
        {/* Search field inside the popup */}
        <ComboboxInput placeholder="Search currency..." aria-label="Search currency" showTrigger={false}>
          <InputGroupAddon align="inline-start">
            <SearchIcon aria-hidden="true" />
          </InputGroupAddon>
        </ComboboxInput>

        <ComboboxEmpty>No currency found.</ComboboxEmpty>

        <ComboboxList>
          {(item: CurrencyItem) => (
            <ComboboxItem key={item.value} value={item}>
              <span className="truncate">{item.label}</span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
