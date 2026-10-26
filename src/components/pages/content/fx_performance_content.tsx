import type { FxPerformanceData } from "@/types/api/display";
import { SmoothLineChart } from "@/components/Charts/SmoothLineChart";
import { AccumulatedWaterfallChart } from "@/components/Charts/AccumulatedWaterfallChart";
import { KpiCard } from "@/components/ui/built_ui/kpiCard";
import { useFxPerformanceFilters } from "@/hooks/usePageFilters";


type FxPerformanceContentProps = {
data: FxPerformanceData 
};

export function FxPerformanceContent({ data }: FxPerformanceContentProps) {
    const { setFilters } = useFxPerformanceFilters();
    const {kpi,charts } = data;
    const waterfallData = charts.waterfallVarianceChart_X && charts.waterfallVarianceChart_Y_data
        ? charts.waterfallVarianceChart_X.map((name, i) => ({name,value: charts.waterfallVarianceChart_Y_data![i],})): [];
    
    const percentChangeYesterday = kpi.changeSinceYesterday ? `${(kpi.changeSinceYesterday*100).toFixed(2)}%` : null
    const percentChangePeriod =kpi.changeSincePeriod ? `${(kpi.changeSincePeriod*100).toFixed(2)}%` : null
    const fixedTodayRate = kpi.todaysRate? kpi.todaysRate.toFixed(2) : null;
    const fixedPrevRate = kpi.previousDayRate? kpi.previousDayRate.toFixed(2) : null;
    const fixedFirstRateInPeriod = kpi.firstRateInPeriod? kpi.firstRateInPeriod.toFixed(2) : null;

    return (
    <section aria-labelledby="placeholder-title">
      
      <div className="kpi-grid">
        <KpiCard title="First rate in chosen period" value={fixedFirstRateInPeriod}/>
        <KpiCard title="Change since the start of Period" value={percentChangePeriod}/>
        <KpiCard title="Rate of today" value={fixedTodayRate} highlight/>
        <KpiCard title="The rate of yesterday" value={fixedPrevRate}/>
        <KpiCard title="Change since yesterday" value={percentChangeYesterday}/>
      </div>
      
      <div className="chart-grid">
        <div className="chart-panel">
          <SmoothLineChart dates={charts.lineChart_X} values={charts.lineChart_Y_data} onClick={(date)=> setFilters({startDate:date, toDate: date})} />
        </div>
        <div className="chart-panel">
          <AccumulatedWaterfallChart data={waterfallData} onClick={(startDate, toDate) => setFilters({startDate:startDate, toDate:toDate})}/>
        </div>
      </div>
    </section>
  );
}