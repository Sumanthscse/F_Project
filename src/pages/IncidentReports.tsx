import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Eye, Edit, Trash2 } from "lucide-react";
import { vehicleApi, Incident, IncidentStatus, IncidentPriority, Vehicle } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

export default function IncidentReports() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [status, setStatus] = useState<IncidentStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const fetchIncidents = async () => {
    const list = await vehicleApi.getIncidents({ search, status });
    setIncidents(list);
  };

  useEffect(() => { fetchIncidents(); }, [status, search]);

  const counts = useMemo(() => {
    return {
      total: incidents.length,
      open: incidents.filter(i => i.status === 'open').length,
      investigating: incidents.filter(i => i.status === 'investigating').length,
      resolved: incidents.filter(i => i.status === 'resolved').length,
    };
  }, [incidents]);

  const priorityBadge = (p: IncidentPriority) => {
    const map: Record<IncidentPriority, string> = {
      low: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    return <span className={`px-2 py-1 text-xs rounded-full ${map[p]}`}>{p.charAt(0).toUpperCase()+p.slice(1)}</span>;
  };

  const statusBadge = (s: IncidentStatus) => {
    const map: Record<IncidentStatus, string> = {
      open: 'bg-rose-100 text-rose-800',
      investigating: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-emerald-100 text-emerald-800',
    };
    return <span className={`px-2 py-1 text-xs rounded-full ${map[s]}`}>{s.charAt(0).toUpperCase()+s.slice(1)}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Incident Reports</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="h-4 w-4 mr-2" />
              Report Incident
            </Button>
          </DialogTrigger>
          <ReportIncidentContent onSubmitted={() => { setOpen(false); fetchIncidents(); }} />
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Incidents" value={counts.total} />
        <StatCard title="Open" value={counts.open} iconColor="text-rose-600" />
        <StatCard title="Investigating" value={counts.investigating} iconColor="text-yellow-600" />
        <StatCard title="Resolved" value={counts.resolved} iconColor="text-emerald-600" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <CardTitle>Incident Reports ({incidents.length})</CardTitle>
            <div className="flex gap-3 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-10 w-64" placeholder="Search incidents..." value={search} onChange={(e)=>setSearch(e.target.value)} />
              </div>
              <Select value={status} onValueChange={(v)=>setStatus(v as any)}>
                <SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {incidents.map((i)=> (
              <div key={i.id} className="py-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                <div className="lg:col-span-4">
                  <div className="font-medium">{titleFor(i.type)}</div>
                  <div className="text-sm text-muted-foreground line-clamp-1">{i.description}</div>
                </div>
                <div className="lg:col-span-2 text-sm">
                  <div className="font-medium">{i.vehicleNumber || 'Vehicle ID: ' + (i.vehicleId || '-') }</div>
                  <div className="text-muted-foreground">Location: {i.location}</div>
                </div>
                <div className="lg:col-span-2 text-sm">Reported By<br/><span className="text-muted-foreground">{i.reportedBy}</span></div>
                <div className="lg:col-span-1">{priorityBadge(i.priority)}</div>
                <div className="lg:col-span-2">{statusBadge(i.status)}</div>
                <div className="lg:col-span-1 text-right pr-2 flex gap-1 justify-end">
                  <IncidentView incident={i} />
                  <IncidentEdit incident={i} onSaved={fetchIncidents} />
                  <button className="p-2 rounded hover:bg-muted" title="Delete" onClick={async ()=>{ if(confirm('Delete this incident?')){ await vehicleApi.deleteIncident(i.id); window.dispatchEvent(new Event('incidents-updated')); fetchIncidents(); } }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function titleFor(t: Incident['type']) {
  switch (t) {
    case 'overload': return 'Overload';
    case 'unauthorized_route': return 'Unauthorized Route';
    case 'permit_violation': return 'Permit Violation';
    default: return 'Incident';
  }
}

function StatCard({ title, value, iconColor }: { title: string; value: number; iconColor?: string; }) {
  return (
    <Card>
      <CardContent className="py-6">
        <div className="text-sm text-muted-foreground">{title}</div>
        <div className={`text-2xl font-semibold ${iconColor || ''}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function IncidentView({ incident }: { incident: Incident }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="p-2 rounded hover:bg-muted" title="View"><Eye className="h-4 w-4" /></button>
      </DialogTrigger>
      <DialogContent className="max-w-lg w-[90vw]">
        <DialogHeader>
          <DialogTitle>{titleFor(incident.type)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <div><span className="font-medium">Vehicle:</span> {incident.vehicleNumber || incident.vehicleId}</div>
          <div><span className="font-medium">Location:</span> {incident.location}</div>
          <div><span className="font-medium">Reported By:</span> {incident.reportedBy}</div>
          <div><span className="font-medium">Priority:</span> {incident.priority}</div>
          <div><span className="font-medium">Status:</span> {incident.status}</div>
          <div className="pt-2"><span className="font-medium">Description:</span><br/>{incident.description}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function IncidentEdit({ incident, onSaved }: { incident: Incident; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    type: incident.type,
    description: incident.description,
    location: incident.location,
    reportedBy: incident.reportedBy,
    priority: incident.priority as IncidentPriority,
    status: incident.status as IncidentStatus,
  });
  const { toast } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await vehicleApi.updateIncident(incident.id, { ...form });
    toast({ title: 'Incident updated' });
    setOpen(false);
    window.dispatchEvent(new Event('incidents-updated'));
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="p-2 rounded hover:bg-muted" title="Edit"><Edit className="h-4 w-4" /></button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl w-[90vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>Edit Incident</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Incident Type</label>
            <Select value={form.type} onValueChange={(v)=>setForm({ ...form, type: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="overload">Overload</SelectItem>
                <SelectItem value="unauthorized_route">Unauthorized Route</SelectItem>
                <SelectItem value="permit_violation">Permit Violation</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Location</label>
            <Input value={form.location} onChange={(e)=>setForm({ ...form, location: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reported By</label>
            <Input value={form.reportedBy} onChange={(e)=>setForm({ ...form, reportedBy: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Priority</label>
            <Select value={form.priority} onValueChange={(v)=>setForm({ ...form, priority: v as IncidentPriority })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={form.status} onValueChange={(v)=>setForm({ ...form, status: v as IncidentStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea value={form.description} onChange={(e)=>setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="md:col-span-2 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-primary">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
function ReportIncidentContent({ onSubmitted }: { onSubmitted: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    vehicleId: '',
    vehicleNumber: '',
    type: 'overload' as Incident['type'],
    description: '',
    location: '',
    reportedBy: '',
    priority: 'medium' as IncidentPriority,
    status: 'open' as IncidentStatus,
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    (async () => {
      const res = await vehicleApi.getVehicles();
      setVehicles(res.vehicles);
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    // If a known vehicle is selected, set its id as well
    const matched = vehicles.find(v => v.vehicleNumber === form.vehicleNumber);
    const payload = { ...form, vehicleId: matched?.id } as any;
    await vehicleApi.createIncident(payload);
    toast({ title: 'Incident reported' });
    // Notify other screens (e.g., Dashboard) to refresh
    window.dispatchEvent(new Event('incidents-updated'));
    onSubmitted();
  };

  return (
    <DialogContent className="max-w-2xl w-[90vw] sm:w-full">
      <DialogHeader>
        <DialogTitle>Report New Incident</DialogTitle>
      </DialogHeader>
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Vehicle</label>
          <Input list="vehicle-numbers" placeholder="Select or enter vehicle number" value={form.vehicleNumber} onChange={(e)=>setForm({ ...form, vehicleNumber: e.target.value })} />
          <datalist id="vehicle-numbers">
            {vehicles.map(v => (
              <option key={v.id} value={v.vehicleNumber} />
            ))}
          </datalist>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Incident Type</label>
          <Select value={form.type} onValueChange={(v)=>setForm({ ...form, type: v as any })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="overload">Overload</SelectItem>
              <SelectItem value="unauthorized_route">Unauthorized Route</SelectItem>
              <SelectItem value="permit_violation">Permit Violation</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-medium">Description</label>
          <Textarea placeholder="Describe the incident in detail..." value={form.description} onChange={(e)=>setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Location</label>
          <Input placeholder="Incident location" value={form.location} onChange={(e)=>setForm({ ...form, location: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Reported By</label>
          <Input placeholder="Officer name" value={form.reportedBy} onChange={(e)=>setForm({ ...form, reportedBy: e.target.value })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Priority</label>
          <Select value={form.priority} onValueChange={(v)=>setForm({ ...form, priority: v as IncidentPriority })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select value={form.status} onValueChange={(v)=>setForm({ ...form, status: v as IncidentStatus })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={()=>onSubmitted()}>Cancel</Button>
          <Button type="submit" className="bg-primary">Report Incident</Button>
        </div>
      </form>
    </DialogContent>
  );
}