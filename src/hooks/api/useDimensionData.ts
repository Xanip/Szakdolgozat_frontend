import { useQuery } from "@tanstack/react-query";

import { dimensionsQueryOptions } from "@/lib/api/queries";

/** Filter option data (currencies, sources, categories, authors). */
export function useDimensionData() {
  return useQuery(dimensionsQueryOptions());
}
