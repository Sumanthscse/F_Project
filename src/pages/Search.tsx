import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";
import { vehicleApi, Vehicle, Incident, IncidentStatus } from "@/services/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Search() {
  const [activeTab, setActiveTab] = useState<'vehicles' | 'incidents'>('vehicles');
  const [query, setQuery] = useState("");
  const [vehicleType, setVehicleType] = useState<'all' | Vehicle['vehicleType']>('all');
  const [vehicleStatus, setVehicleStatus] = useState<'all' | Vehicle['status']>('all');
  const [incidentStatus, setIncidentStatus] = useState<IncidentStatus | 'all'>('all');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);

  const debouncedQuery = useDebounce(query, 250);

  const fetchVehicles = async () => {
    setLoading(true);
    const res = await vehicleApi.getVehicles({
      search: debouncedQuery || undefined,
      status: vehicleStatus !== 'all' ? vehicleStatus : undefined,
      vehicleType: vehicleType !== 'all' ? vehicleType : undefined,
    });
    setVehicles(res.vehicles);
    setLoading(false);
  };

  const fetchIncidents = async () => {
    setLoading(true);
    const res = await vehicleApi.getIncidents({ search: debouncedQuery || undefined, status: incidentStatus });
    setIncidents(res);
    setLoading(false);
  };

  useEffect(() => {
    activeTab === 'vehicles' ? fetchVehicles() : fetchIncidents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, debouncedQuery, vehicleType, vehicleStatus, incidentStatus]);

  const vehicleCount = useMemo(() => vehicles.length, [vehicles]);
  const incidentCount = useMemo(() => incidents.length, [incidents]);

  const clearAll = () => {
    setQuery("");
    setVehicleType('all');
    setVehicleStatus('all');
    setIncidentStatus('all');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Search & Filter</h1>
          <p className="text-muted-foreground">Find vehicles and incidents quickly</p>
        </div>
        <div className="inline-flex rounded-md overflow-hidden border border-border">
          <button className={`px-4 py-2 text-sm ${activeTab==='vehicles' ? 'bg-primary text-primary-foreground' : 'bg-background'}`} onClick={()=>setActiveTab('vehicles')}>Vehicles</button>
          <button className={`px-4 py-2 text-sm ${activeTab==='incidents' ? 'bg-primary text-primary-foreground' : 'bg-background'}`} onClick={()=>setActiveTab('incidents')}>Incidents</button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{activeTab === 'vehicles' ? `Vehicles (${vehicleCount})` : `Incidents (${incidentCount})`}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative col-span-1 lg:col-span-2">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={activeTab==='vehicles' ? 'Search by vehicle, owner, phone...' : 'Search by vehicle, location, description...'} value={query} onChange={(e)=>setQuery(e.target.value)} className="pl-10" />
            </div>

            {activeTab === 'vehicles' ? (
              <>
                <Select value={vehicleStatus} onValueChange={(v)=>setVehicleStatus(v as any)}>
                  <SelectTrigger><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={vehicleType} onValueChange={(v)=>setVehicleType(v as any)}>
                  <SelectTrigger><SelectValue placeholder="All Types" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="truck">Truck</SelectItem>
                    <SelectItem value="dumper">Dumper</SelectItem>
                    <SelectItem value="trailer">Trailer</SelectItem>
                    <SelectItem value="tipper">Tipper</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </>
            ) : (
              <>
                <Select value={incidentStatus} onValueChange={(v)=>setIncidentStatus(v as any)}>
                  <SelectTrigger><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                <div />
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={clearAll}>Clear All</Button>
          </div>

          {activeTab === 'vehicles' ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle Details</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Type & Capacity</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow>
                  ) : vehicles.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No vehicles found</TableCell></TableRow>
                  ) : (
                    vehicles.map(v => (
                      <TableRow key={v.id}>
                        <TableCell>
                          <div className="font-medium">{v.vehicleNumber}</div>
                          <div className="text-xs text-muted-foreground">Reg: {v.registrationDate}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{v.ownerName}</div>
                          <div className="text-xs text-muted-foreground">{v.ownerPhone}</div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {v.vehicleType.charAt(0).toUpperCase()+v.vehicleType.slice(1)}{v.capacityTons ? ` • ${v.capacityTons} tons` : ''}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            v.status === 'active' ? 'bg-green-100 text-green-800' :
                            v.status === 'flagged' ? 'bg-red-100 text-red-800' :
                            v.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{v.status}</span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : incidents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No incidents found</div>
              ) : (
                incidents.map(i => (
                  <Card key={i.id}>
                    <CardContent className="py-4 grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                      <div>
                        <div className="font-medium">{i.vehicleNumber || i.vehicleId}</div>
                        <div className="text-xs text-muted-foreground">{i.location}</div>
                      </div>
                      <div className="text-sm md:col-span-2 line-clamp-2">{i.description}</div>
                      <div className="justify-self-start md:justify-self-end">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          i.status === 'open' ? 'bg-rose-100 text-rose-800' :
                          i.status === 'investigating' ? 'bg-yellow-100 text-yellow-800' : 'bg-emerald-100 text-emerald-800'}`}>{i.status}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}