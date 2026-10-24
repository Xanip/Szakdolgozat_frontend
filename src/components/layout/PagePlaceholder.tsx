import type { RouteConfig } from "@/types/navigation";

type PagePlaceholderProps = {
  route: RouteConfig;
};

/**
 * Minimal placeholder for a planned analytics page. Identifies the page and
 * signals that its detailed design is implemented in a later specification.
 */
export function PagePlaceholder({ route }: PagePlaceholderProps) {
  const Icon = route.icon;
  return (
    <section className="placeholder" aria-labelledby="placeholder-title">
      <div className="placeholder-icon">
        <Icon aria-hidden="true" />
      </div>
      <p className="eyebrow">Workspace view</p>
      <h2 id="placeholder-title">{route.title}</h2>
      <p className="placeholder-copy">
        Detailed analytics for this page will be implemented in a later
        specification.
      </p>
    </section>
  );
}
