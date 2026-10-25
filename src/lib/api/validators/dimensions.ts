import type { RawDimensionsResponse } from "@/types/api/raw";

import {
  arrayOf,
  integer,
  nullable,
  object,
  string,
  validateResponse,
  type Decoder,
} from "./guards";

const decodeDimensions: Decoder<RawDimensionsResponse> = object({
  DimAuthors: arrayOf(object({ AuthorID: integer, AuthorName: string })),
  DimCategories: arrayOf(
    object({ CategoryID: integer, CategoryName: string }),
  ),
  DimCurrencies: arrayOf(
    object({
      CurrencyID: integer,
      CurrencyCode: string,
      CurrencyName: nullable(string),
      CurrencySymbol: nullable(string),
    }),
  ),
  DimSources: arrayOf(object({ SourceID: integer, SourceName: string })),
});

/** Validates GET /exchange-rates/pages. */
export function validateDimensionsResponse(
  value: unknown,
): RawDimensionsResponse {
  return validateResponse("/exchange-rates/pages", decodeDimensions, value);
}
