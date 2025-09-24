import { useState, useEffect } from "react";
import { StatsCard } from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Truck, 
  AlertTriangle, 
  Flag, 
  CheckCircle, 
  Search,
  Download,
  Eye,
  Edit
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { vehicleApi, Vehicle, Incident } from "@/services/api";
import { VehicleDetailsDialog } from "@/components/VehicleDetailsDialog";
import { EditVehicleDialog } from "@/components/EditVehicleDialog";

export default function Dashboard() {
  const [vehicleStats, setVehicleStats] = useState({
    total: 0,
    active: 0,
    flagged: 0,
    suspended: 0
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activeIncidents, setActiveIncidents] = useState<Incident[]>([]);

  const filterVehicles = (vehicles: Vehicle[], search: string, status: string) => {
    let filtered = [...vehicles];
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(vehicle =>
        vehicle.vehicleNumber.toLowerCase().includes(searchLower) ||
        vehicle.ownerName.toLowerCase().includes(searchLower) ||
        vehicle.ownerPhone.includes(search)
      );
    }
    
    // Apply status filter
    if (status !== "all") {
      filtered = filtered.filter(vehicle => vehicle.status === status);
    }
    
    return filtered;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await vehicleApi.getVehicles();
      const vehicles = response.vehicles;
      
      setVehicles(vehicles);
      const incidents = await vehicleApi.getIncidents({ status: 'open' });
      setActiveIncidents(incidents);
      setVehicleStats({
        total: vehicles.length,
        active: vehicles.filter(v => v.status === 'active').length,
        flagged: vehicles.filter(v => v.status === 'flagged').length,
        suspended: vehicles.filter(v => v.status === 'suspended').length
      });
      
      // Apply current filters
      const filtered = filterVehicles(vehicles, searchTerm, statusFilter);
      setFilteredVehicles(filtered);
    } catch (error) {
      console.error('Failed to fetch vehicle data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handler = () => fetchData();
    window.addEventListener('incidents-updated', handler);
    return () => window.removeEventListener('incidents-updated', handler);
  }, []);

  // Apply filters when search term or status filter changes
  useEffect(() => {
    const filtered = filterVehicles(vehicles, searchTerm, statusFilter);
    setFilteredVehicles(filtered);
  }, [searchTerm, statusFilter, vehicles]);

  // Refresh data when the page becomes visible (e.g., when navigating back from vehicle records)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Action handlers
  const handleViewVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setViewDialogOpen(true);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setEditDialogOpen(true);
  };

  const handleVehicleUpdated = () => {
    fetchData();
  };

  const downloadTextFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportCurrentVehicles = () => {
    const lines: string[] = [];
    lines.push("Vehicle Records Export (Dashboard)\n");
    filteredVehicles.forEach(v => {
      lines.push(`Vehicle Number: ${v.vehicleNumber}`);
      lines.push(`Type: ${v.vehicleType}`);
      lines.push(`Capacity (tons): ${v.capacityTons ?? '-'}`);
      lines.push(`GPS Number: ${v.gpsNumber ?? '-'}`);
      lines.push(`GPS ID: ${v.gpsId ?? '-'}`);
      lines.push(`Owner Name: ${v.ownerName}`);
      lines.push(`Owner Phone: ${v.ownerPhone}`);
      lines.push(`Owner Address: ${v.ownerAddress}`);
      lines.push(`License Number: ${v.licenseNumber ?? '-'}`);
      lines.push(`Registration Date: ${v.registrationDate}`);
      lines.push(`Status: ${v.status}`);
      lines.push(`Last Activity: ${v.lastActivity ?? '-'}`);
      lines.push(`Notes: ${v.notes ?? '-'}`);
      lines.push("---\n");
    });
    downloadTextFile(`vehicle-records-dashboard-${new Date().toISOString().slice(0,10)}.txt`, lines.join("\n"));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Vehicles Monitored"
          value={vehicleStats.total.toString()}
          change="+12% from last month"
          changeType="positive"
          icon={Truck}
          iconColor="blue"
        />
        <StatsCard
          title="Active Incidents"
          value={activeIncidents.length.toString()}
          change="Requires attention"
          changeType={activeIncidents.length > 0 ? "negative" : "neutral"}
          icon={AlertTriangle}
          iconColor="orange"
        />
        <StatsCard
          title="Flagged Vehicles"
          value={vehicleStats.flagged.toString()}
          change="Under investigation"
          changeType="neutral"
          icon={Flag}
          iconColor="red"
        />
        <StatsCard
          title="Active Vehicles"
          value={vehicleStats.active.toString()}
          change="Currently operational"
          changeType="positive"
          icon={CheckCircle}
          iconColor="green"
        />
      </div>

      {/* Recent Activity and Priority Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary">
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-muted-foreground py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                Loading activity...
              </div>
            ) : filteredVehicles.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No recent activity
              </div>
            ) : (
              <div className="space-y-3">
                {filteredVehicles.slice(0, 3).map((vehicle) => (
                  <div key={vehicle.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        Vehicle {vehicle.vehicleNumber} registered
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(vehicle.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      vehicle.status === 'active' ? 'bg-green-100 text-green-800' :
                      vehicle.status === 'flagged' ? 'bg-red-100 text-red-800' :
                      vehicle.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Priority Alerts</CardTitle>
            <span className="text-sm text-destructive">{activeIncidents.length} Active</span>
          </CardHeader>
          <CardContent>
            {activeIncidents.length === 0 ? (
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                <div>
                  <p className="font-medium">All Clear</p>
                  <p className="text-sm text-muted-foreground">No active incidents.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {activeIncidents.slice(0,3).map(i => (
                  <div key={i.id} className="p-3 rounded-lg bg-muted/50">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{i.vehicleNumber || i.vehicleId}</span>
                      <span className="text-amber-700">{i.priority.toUpperCase()}</span>
                    </div>
                    <div className="text-sm text-muted-foreground line-clamp-1">{i.description}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Records Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Vehicle Records ({filteredVehicles.length})</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search vehicles..." 
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="flagged">Flagged</option>
                <option value="inactive">Inactive</option>
              </select>
              {(searchTerm || statusFilter !== "all") && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              )}
              <Button size="sm" className="bg-primary" onClick={exportCurrentVehicles}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle Details</TableHead>
                <TableHead>Owner Information</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="ml-2">Loading vehicles...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredVehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    <div>
                      <p className="font-medium">No vehicles found</p>
                      <p className="text-sm">
                        {searchTerm || statusFilter !== "all" 
                          ? "Try adjusting your search criteria or filters" 
                          : "Add new vehicles to get started"
                        }
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredVehicles.slice(0, 5).map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{vehicle.vehicleNumber}</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {vehicle.vehicleType}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Reg: {new Date(vehicle.registrationDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{vehicle.ownerName}</div>
                        <div className="text-sm text-muted-foreground">{vehicle.ownerPhone}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {vehicle.ownerAddress}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {vehicle.lastActivity ? new Date(vehicle.lastActivity).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : 'Never'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        vehicle.status === 'active' ? 'bg-green-100 text-green-800' :
                        vehicle.status === 'flagged' ? 'bg-red-100 text-red-800' :
                        vehicle.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="View details"
                          onClick={() => handleViewVehicle(vehicle)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="Edit vehicle"
                          onClick={() => handleEditVehicle(vehicle)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <VehicleDetailsDialog
        vehicle={selectedVehicle}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
      />
      
      <EditVehicleDialog
        vehicle={selectedVehicle}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onVehicleUpdated={handleVehicleUpdated}
      />
    </div>
  );
}