import type { RouteConfig } from "@/types/navigation";

type MediaAnalyticsPageProps = {
  route: RouteConfig;
};

export function MediaAnalyticsPage({ route }: MediaAnalyticsPageProps) {
  const Icon = route.icon;
  return (
    <section className="placeholder" aria-labelledby="placeholder-title">
      <div className="placeholder-icon">
        <Icon aria-hidden="true" />
      </div>
      <h2 id="placeholder-title">{route.title}</h2>
    </section>
  );
}
