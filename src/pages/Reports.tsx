import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Calendar, BarChart } from "lucide-react";
import { vehicleApi, Vehicle, Incident } from "@/services/api";

export default function Reports() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    (async () => {
      const v = await vehicleApi.getVehicles();
      const i = await vehicleApi.getIncidents();
      setVehicles(v.vehicles);
      setIncidents(i);
    })();
  }, []);

  const downloadText = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const buildIncidentsReport = (from?: string, to?: string) => {
    const list = incidents.filter(i => inRange(i.createdAt, from, to));
    const lines: string[] = [];
    lines.push(`Incident Report (${from || 'All'} to ${to || 'Now'})\n`);
    list.forEach(i => {
      lines.push(`- ${i.id} | ${i.type} | ${i.status} | ${i.vehicleNumber || i.vehicleId || ''}`);
      lines.push(`  ${i.location} | ${i.priority} | ${new Date(i.createdAt).toLocaleString()}`);
      lines.push(`  ${i.description}`);
    });
    return lines.join('\n');
  };

  const buildVehiclesReport = (from?: string, to?: string) => {
    const list = vehicles.filter(v => inRange(v.createdAt, from, to));
    const lines: string[] = [];
    lines.push(`Vehicle Records (${from || 'All'} to ${to || 'Now'})\n`);
    list.forEach(v => {
      lines.push(`- ${v.vehicleNumber} | ${v.vehicleType} | cap:${v.capacityTons ?? '-'}t | GPS:${v.gpsNumber ?? '-'} / ${v.gpsId ?? '-'}`);
      lines.push(`  Owner: ${v.ownerName} (${v.ownerPhone}) | Status: ${v.status} | Reg: ${v.registrationDate}`);
    });
    return lines.join('\n');
  };

  const generateAndDownload = (content: string, name: string) => {
    downloadText(`${name}-${new Date().toISOString().slice(0,10)}.txt`, content);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Report Generator</h1>
        <p className="text-muted-foreground">Create and download reports using current data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Templates */}
          <Card>
            <CardHeader><CardTitle>Report Templates</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <TemplateRow title="Daily Vehicle Activity Report" subtitle="Summary of all vehicle activities, inspections, and violations for the day" onClick={() => generateAndDownload(buildVehiclesReport(getDateDaysAgo(1), getDateDaysAgo(0)), 'daily-vehicle-activity')} />
              <TemplateRow title="Weekly Incident Summary" subtitle="Comprehensive report of all incidents reported and resolved during the week" onClick={() => generateAndDownload(buildIncidentsReport(getDateDaysAgo(7), getDateDaysAgo(0)), 'weekly-incident-summary')} />
              <TemplateRow title="Monthly Compliance Report" subtitle="Detailed compliance metrics and violation trends for the month" onClick={() => generateAndDownload(buildVehiclesReport(getDateMonthsAgo(1), getDateDaysAgo(0)), 'monthly-compliance')} />
              <TemplateRow title="Performance Analytics Report" subtitle="KPI dashboard and performance metrics analysis" onClick={() => generateAndDownload(buildIncidentsReport(getDateMonthsAgo(3), getDateDaysAgo(0)), 'performance-analytics')} />
            </CardContent>
          </Card>

          {/* Custom Generator */}
          <Card>
            <CardHeader><CardTitle>Custom Report Generator</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input placeholder="Report Name" id="reportName" />
                <Select defaultValue="txt">
                  <SelectTrigger><SelectValue placeholder="Format" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="txt">TXT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input type="date" id="fromDate" />
                <Input type="date" id="toDate" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Include Sections</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                  <label className="inline-flex items-center gap-2"><input type="checkbox" defaultChecked id="secVehicles" /> Vehicle Records & Activity</label>
                  <label className="inline-flex items-center gap-2"><input type="checkbox" defaultChecked id="secIncidents" /> Incident Reports & Analysis</label>
                  <label className="inline-flex items-center gap-2"><input type="checkbox" id="secCompliance" /> Compliance Metrics</label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  const name = (document.getElementById('reportName') as HTMLInputElement)?.value || 'custom-report';
                  const from = (document.getElementById('fromDate') as HTMLInputElement)?.value || undefined;
                  const to = (document.getElementById('toDate') as HTMLInputElement)?.value || undefined;
                  const includeVehicles = (document.getElementById('secVehicles') as HTMLInputElement)?.checked;
                  const includeIncidents = (document.getElementById('secIncidents') as HTMLInputElement)?.checked;
                  const includeCompliance = (document.getElementById('secCompliance') as HTMLInputElement)?.checked;
                  let content = `Custom Report (from ${from || 'All'} to ${to || 'Now'})\n\n`;
                  if (includeVehicles) content += buildVehiclesReport(from, to) + '\n\n';
                  if (includeIncidents) content += buildIncidentsReport(from, to) + '\n\n';
                  if (includeCompliance) content += buildComplianceSection(vehicles, from, to) + '\n\n';
                  generateAndDownload(content, name);
                }}>Generate & Download</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent & Quick Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full" onClick={() => generateAndDownload(buildVehiclesReport(), 'export-all-vehicles')}><Download className="h-4 w-4 mr-2" />Export All Vehicles</Button>
              <Button variant="outline" className="w-full" onClick={() => generateAndDownload(buildIncidentsReport(), 'export-all-incidents')}><Download className="h-4 w-4 mr-2" />Export All Incidents</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TemplateRow({ title, subtitle, onClick }: { title: string; subtitle: string; onClick: () => void }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 border rounded-md">
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </div>
      <Button size="sm" onClick={onClick}><Download className="h-4 w-4 mr-2" />Generate & Download</Button>
    </div>
  );
}

function inRange(iso: string, from?: string, to?: string) {
  const date = new Date(iso);
  if (from && date < new Date(from)) return false;
  if (to && date > new Date(to + 'T23:59:59')) return false;
  return true;
}

function getDateDaysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0,10); }
function getDateMonthsAgo(n: number) { const d = new Date(); d.setMonth(d.getMonth() - n); return d.toISOString().slice(0,10); }

function buildComplianceSection(vehicles: Vehicle[], from?: string, to?: string) {
  const list = vehicles.filter(v => inRange(v.createdAt, from, to));
  const statuses: Record<string, number> = {};
  list.forEach(v => { statuses[v.status] = (statuses[v.status] || 0) + 1; });
  const total = list.length || 1;
  const lines: string[] = [];
  lines.push('Compliance Metrics');
  Object.entries(statuses).forEach(([k,v]) => lines.push(`- ${k}: ${v} (${Math.round((v/total)*100)}%)`));
  return lines.join('\n');
}