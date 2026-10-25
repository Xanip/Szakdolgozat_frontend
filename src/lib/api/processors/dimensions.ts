import type { DimensionData } from "@/types/api/display";
import type { RawDimensionsResponse } from "@/types/api/raw";

/** Maps validated dimension tables to filter option data. */
export function processDimensions(raw: RawDimensionsResponse): DimensionData {
  return {
    currencies: raw.DimCurrencies.map((currency) => ({
      id: currency.CurrencyID,
      code: currency.CurrencyCode,
      name: currency.CurrencyName,
      symbol: currency.CurrencySymbol,
    })),
    sources: raw.DimSources.map((source) => ({
      id: source.SourceID,
      name: source.SourceName,
    })),
    categories: raw.DimCategories.map((category) => ({
      id: category.CategoryID,
      name: category.CategoryName,
    })),
    authors: raw.DimAuthors.map((author) => ({
      id: author.AuthorID,
      name: author.AuthorName,
    })),
  };
}
