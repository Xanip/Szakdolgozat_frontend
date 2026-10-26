import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "cn";

type FilterBoxProps = {
  title?: string;
  children: ReactNode;
  className?: string;
};

/** Card-style frame that holds the page filters at the top of a page. */
export function FilterBox({ title = "Filters", children, className }: FilterBoxProps) {
  return (
    <Card className={cn("filter-box", className)} role="group" aria-label={title}>
      <CardHeader className="justify-items-center text-center">
        <CardTitle className="text-sm font-bold uppercase tracking-[0.14em] text-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="filter-box-row">{children}</CardContent>
    </Card>
  );
}

type FilterFieldProps = {
  label: string;
  children: ReactNode;
};

/** A labelled slot inside a FilterBox. */
export function FilterField({ label, children }: FilterFieldProps) {
  return (
    <div className="filter-field flex flex-col items-center gap-1.5 text-center">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
