import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { vehicleApi, Vehicle, Incident } from "@/services/api";
import { Calendar, Download, TrendingUp } from "lucide-react";

export default function Analytics() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [rangePreset, setRangePreset] = useState<string>("6m");
  const [startDate, setStartDate] = useState<string>(getDateMonthsAgo(6));
  const [endDate, setEndDate] = useState<string>(formatDate(new Date()));

  const inRange = (iso: string) => {
    const d = new Date(iso);
    return d >= new Date(startDate) && d <= new Date(endDate + "T23:59:59");
  };

  const filteredVehicles = useMemo(() => vehicles.filter(v => inRange(v.createdAt)), [vehicles, startDate, endDate]);
  const filteredIncidents = useMemo(() => incidents.filter(i => inRange(i.createdAt)), [incidents, startDate, endDate]);

  const totals = useMemo(() => {
    const totalVehicles = filteredVehicles.length;
    const activeIncidents = filteredIncidents.filter(i => i.status === 'open').length;
    const resolved = filteredIncidents.filter(i => i.status === 'resolved').length;
    const resolutionRate = filteredIncidents.length ? Math.round((resolved / filteredIncidents.length) * 100) : 0;
    const complianceScore = calcComplianceScore(filteredVehicles);
    return { totalVehicles, activeIncidents, resolutionRate, complianceScore };
  }, [filteredVehicles, filteredIncidents]);

  const monthlySeries = useMemo(() => buildMonthlySeries(startDate, endDate, filteredIncidents, filteredVehicles), [startDate, endDate, filteredIncidents, filteredVehicles]);
  const incidentTypeDist = useMemo(() => buildIncidentTypeDist(filteredIncidents), [filteredIncidents]);
  const vehicleStatusDist = useMemo(() => buildVehicleStatusDist(filteredVehicles), [filteredVehicles]);
  const weekdayActivity = useMemo(() => buildWeekdayActivity(filteredIncidents), [filteredIncidents]);

  useEffect(() => {
    (async () => {
      const v = await vehicleApi.getVehicles();
      const i = await vehicleApi.getIncidents();
      setVehicles(v.vehicles);
      setIncidents(i);
    })();
  }, []);

  const onPresetChange = (value: string) => {
    setRangePreset(value);
    if (value === '6m') { setStartDate(getDateMonthsAgo(6)); setEndDate(formatDate(new Date())); }
    if (value === '12m') { setStartDate(getDateMonthsAgo(12)); setEndDate(formatDate(new Date())); }
    if (value === '30d') { setStartDate(getDateDaysAgo(30)); setEndDate(formatDate(new Date())); }
  };

  const exportReport = () => {
    const lines: string[] = [];
    lines.push(`Analytics Report (${startDate} to ${endDate})\n`);
    lines.push(`Total Vehicles: ${totals.totalVehicles}`);
    lines.push(`Active Incidents: ${totals.activeIncidents}`);
    lines.push(`Resolution Rate: ${totals.resolutionRate}%`);
    lines.push(`Compliance Score: ${totals.complianceScore}%\n`);
    lines.push("Incident Types Distribution:");
    Object.entries(incidentTypeDist).forEach(([k,v]) => lines.push(`- ${k}: ${v.count} (${v.percent}%)`));
    lines.push("\nVehicle Status Overview:");
    Object.entries(vehicleStatusDist).forEach(([k,v]) => lines.push(`- ${k}: ${v.count} (${v.percent}%)`));
    lines.push("\nMonthly Trends:");
    monthlySeries.labels.forEach((label, idx) => {
      lines.push(`${label}: Incidents=${monthlySeries.incidents[idx]}, Resolved=${monthlySeries.resolved[idx]}, Vehicles=${monthlySeries.vehicles[idx]}`);
    });
    downloadText(`analytics-${startDate}-to-${endDate}.txt`, lines.join("\n"));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics & Reports</h1>
          <p className="text-muted-foreground">Monitor performance and generate insights from current data</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={rangePreset} onValueChange={onPresetChange}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Last 6 Months" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="12m">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} />
            <span className="text-sm">to</span>
            <Input type="date" value={endDate} onChange={(e)=>setEndDate(e.target.value)} />
          </div>
          <Button className="bg-primary" onClick={exportReport}><Download className="h-4 w-4 mr-2" />Export Report</Button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Vehicles Monitored" value={totals.totalVehicles} changeLabel="vs selected range" />
        <StatCard title="Active Incidents" value={totals.activeIncidents} changeLabel="current open" />
        <StatCard title="Resolution Rate" value={`${totals.resolutionRate}%`} changeLabel="Resolved/All" />
        <StatCard title="Compliance Score" value={`${totals.complianceScore}%`} changeLabel="Based on status mix" />
      </div>

      {/* Monthly Trends (simple line-like visual using bars) */}
      <Card>
        <CardHeader><CardTitle>Monthly Trends</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[640px] grid grid-cols-12 gap-3">
              {monthlySeries.labels.map((label, idx) => (
                <div key={label} className="flex flex-col items-center">
                  <div className="h-40 w-6 flex flex-col-reverse gap-1">
                    <div className="bg-red-400 rounded" style={{height: scaleBar(monthlySeries.incidents[idx])}} title={`Incidents ${monthlySeries.incidents[idx]}`} />
                    <div className="bg-green-400 rounded" style={{height: scaleBar(monthlySeries.resolved[idx])}} title={`Resolved ${monthlySeries.resolved[idx]}`} />
                    <div className="bg-blue-400 rounded" style={{height: scaleBar(monthlySeries.vehicles[idx])}} title={`Vehicles ${monthlySeries.vehicles[idx]}`} />
                  </div>
                  <span className="mt-2 text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs">
              <span className="inline-block w-3 h-3 bg-red-400 rounded" /> Incidents
              <span className="inline-block w-3 h-3 bg-green-400 rounded" /> Resolved
              <span className="inline-block w-3 h-3 bg-blue-400 rounded" /> Vehicles
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Incident Types Distribution</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {Object.entries(incidentTypeDist).map(([k,v]) => (
                <li key={k} className="flex justify-between"><span className="capitalize">{prettyType(k)}</span><span>{v.count} ({v.percent}%)</span></li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Vehicle Status Overview</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {Object.entries(vehicleStatusDist).map(([k,v]) => (
                <li key={k} className="flex justify-between capitalize"><span>{k}</span><span>{v.count} ({v.percent}%)</span></li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Weekday Activity */}
      <Card>
        <CardHeader><CardTitle>Daily Activity Overview</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekdayActivity.labels.map((d, idx) => (
              <div key={d} className="flex flex-col items-center">
                <div className="h-40 w-full flex flex-col-reverse">
                  <div className="bg-blue-500 rounded" style={{height: scaleBar(weekdayActivity.counts[idx])}} />
                </div>
                <span className="mt-1 text-xs">{d}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, changeLabel }: { title: string; value: number | string; changeLabel?: string }) {
  return (
    <Card>
      <CardContent className="py-6">
        <div className="text-sm text-muted-foreground">{title}</div>
        <div className="text-2xl font-semibold">{value}</div>
        {changeLabel && (
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {changeLabel}</div>
        )}
      </CardContent>
    </Card>
  );
}

function buildMonthlySeries(start: string, end: string, incidents: Incident[], vehicles: Vehicle[]) {
  const labels: string[] = [];
  const incidentsArr: number[] = [];
  const resolvedArr: number[] = [];
  const vehiclesArr: number[] = [];
  const startDate = new Date(start);
  const endDate = new Date(end);
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  while (current <= endDate) {
    const label = current.toLocaleString('en-US', { month: 'short' });
    labels.push(label);
    const month = current.getMonth();
    const year = current.getFullYear();
    incidentsArr.push(incidents.filter(i => new Date(i.createdAt).getMonth() === month && new Date(i.createdAt).getFullYear() === year).length);
    resolvedArr.push(incidents.filter(i => i.status === 'resolved' && new Date(i.createdAt).getMonth() === month && new Date(i.createdAt).getFullYear() === year).length);
    vehiclesArr.push(vehicles.filter(v => new Date(v.createdAt).getMonth() === month && new Date(v.createdAt).getFullYear() === year).length);
    current.setMonth(current.getMonth() + 1);
  }
  return { labels, incidents: incidentsArr, resolved: resolvedArr, vehicles: vehiclesArr };
}

function buildIncidentTypeDist(incidents: Incident[]) {
  const groups: Record<string, number> = {};
  incidents.forEach(i => { groups[i.type] = (groups[i.type] || 0) + 1; });
  const total = incidents.length || 1;
  const result: Record<string, { count: number; percent: number }> = {};
  Object.entries(groups).forEach(([k, v]) => { result[k] = { count: v, percent: Math.round((v / total) * 100) }; });
  return result;
}

function buildVehicleStatusDist(vehicles: Vehicle[]) {
  const statuses: Record<string, number> = {};
  vehicles.forEach(v => { statuses[v.status] = (statuses[v.status] || 0) + 1; });
  const total = vehicles.length || 1;
  const result: Record<string, { count: number; percent: number }> = {};
  Object.entries(statuses).forEach(([k, v]) => { result[k] = { count: v, percent: Math.round((v / total) * 100) }; });
  return result;
}

function buildWeekdayActivity(incidents: Incident[]) {
  const labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const counts = new Array(7).fill(0);
  incidents.forEach(i => {
    const d = new Date(i.createdAt);
    const idx = (d.getDay() + 6) % 7; // make Monday index 0
    counts[idx]++;
  });
  return { labels, counts };
}

function calcComplianceScore(vehicles: Vehicle[]) {
  if (vehicles.length === 0) return 0;
  const weight = { active: 1, inactive: 0.6, flagged: 0.4, suspended: 0.3 } as Record<string, number>;
  const score = vehicles.reduce((acc, v) => acc + (weight[v.status] || 0.5), 0);
  return Math.round((score / vehicles.length) * 100);
}

function getDateMonthsAgo(n: number) { const d = new Date(); d.setMonth(d.getMonth() - n); return formatDate(d); }
function getDateDaysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return formatDate(d); }
function formatDate(d: Date) { return d.toISOString().slice(0,10); }
function prettyType(t: string) {
  if (t === 'unauthorized_route') return 'Unauthorized Route';
  if (t === 'permit_violation') return 'Permit Violation';
  return t.charAt(0).toUpperCase() + t.slice(1);
}
function scaleBar(v: number) { const h = Math.min(100, v * 10); return `${h}px`; }
function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}