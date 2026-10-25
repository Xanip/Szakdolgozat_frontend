import type { FxPerformanceData } from "@/types/api/display";
import { Card } from "@/components/ui/card";
import { SmoothLineChart } from "@/components/Charts/SmoothLineChart";
import { AccumulatedWaterfallChart } from "@/components/Charts/AccumulatedWaterfallChart";


type FxPerformanceContentProps = {
data: FxPerformanceData 
};

export function FxPerformanceContent({ data }: FxPerformanceContentProps) {
    const {kpi,charts } = data;
    const waterfallData = charts.waterfallVarianceChart_X && charts.waterfallVarianceChart_Y_data
        ? charts.waterfallVarianceChart_X.map((name, i) => ({name,value: charts.waterfallVarianceChart_Y_data![i],})): [];
    
    return (
    <section aria-labelledby="placeholder-title">
      
      <div>
        <Card>{kpi.todaysRate}</Card>
        <Card>{kpi.previousDayRate}</Card>
        <Card>{kpi.changeSinceYesterday}</Card>
        <Card>{kpi.firstRateInPeriod}</Card>
        <Card>{kpi.changeSincePeriod}</Card>
      </div>
      
        <SmoothLineChart dates={charts.lineChart_X} values={charts.lineChart_Y_data}/>
        <AccumulatedWaterfallChart data={waterfallData}/>
    </section>
  );
}