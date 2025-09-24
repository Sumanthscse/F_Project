import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Download, Edit, Trash2, Eye } from "lucide-react";
import { VehicleRegistrationDialog } from "@/components/VehicleRegistrationDialog";
import { VehicleDetailsDialog } from "@/components/VehicleDetailsDialog";
import { EditVehicleDialog } from "@/components/EditVehicleDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { vehicleApi, Vehicle } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

export default function VehicleRecords() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await vehicleApi.getVehicles({
        search: searchTerm || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setVehicles(response.vehicles);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch vehicles. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [searchTerm, statusFilter]);

  const handleVehicleAdded = () => {
    fetchVehicles();
  };

  const handleViewVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setViewDialogOpen(true);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setEditDialogOpen(true);
  };

  const handleDeleteVehicle = async (id: string, vehicleNumber: string) => {
    if (!confirm(`Are you sure you want to delete vehicle ${vehicleNumber}? This action cannot be undone.`)) return;
    
    try {
      await vehicleApi.deleteVehicle(id);
      toast({
        title: "Vehicle Deleted",
        description: `Vehicle ${vehicleNumber} has been deleted successfully.`,
      });
      fetchVehicles();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete vehicle. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleVehicleUpdated = () => {
    fetchVehicles();
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

  const handleExport = () => {
    const lines: string[] = [];
    lines.push("Vehicle Records Export\n");
    vehicles.forEach(v => {
      lines.push(`Vehicle Number: ${v.vehicleNumber}`);
      lines.push(`Type: ${v.vehicleType}`);
      lines.push(`Capacity (tons): ${v.capacityTons ?? '-'} `);
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
    downloadTextFile(`vehicle-records-${new Date().toISOString().slice(0,10)}.txt`, lines.join("\n"));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      case 'flagged':
        return 'bg-red-100 text-red-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Vehicle Records</h1>
        <VehicleRegistrationDialog onVehicleAdded={handleVehicleAdded}>
          <Button className="bg-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-2" />
            Register New Vehicle
          </Button>
        </VehicleRegistrationDialog>
      </div>

      {/* Vehicle Records Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Vehicle Records ({vehicles.length})</CardTitle>
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
              <Button size="sm" className="bg-primary" onClick={handleExport}>
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
                <TableHead>Type & Capacity</TableHead>
                <TableHead>GPS Number / ID</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-2">Loading vehicles...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : vehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                    <div>
                      <div className="mb-4">
                        <svg 
                          className="mx-auto h-12 w-12 mb-4" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={1} 
                            d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={1} 
                            d="M13 6H4L2 4h-.5a.5.5 0 000 1H2L4 7h9.5a.5.5 0 00.485-.379L15.5 3.5"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-foreground mb-2">No vehicles found</h3>
                      <p className="text-sm mb-6">Try adjusting your search criteria or add new vehicles</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                vehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{vehicle.vehicleNumber}</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {vehicle.vehicleType}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Reg: {formatDate(vehicle.registrationDate)}
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
                        {vehicle.vehicleType.charAt(0).toUpperCase() + vehicle.vehicleType.slice(1)}
                        {vehicle.capacityTons ? ` • ${vehicle.capacityTons} tons` : ''}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {vehicle.gpsNumber || '-'}{vehicle.gpsId ? ` / ${vehicle.gpsId}` : ''}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {vehicle.lastActivity ? formatDate(vehicle.lastActivity) : 'Never'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(vehicle.status)}`}>
                        {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewVehicle(vehicle)}
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditVehicle(vehicle)}
                          title="Edit vehicle"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteVehicle(vehicle.id, vehicle.vehicleNumber)}
                          className="text-destructive hover:text-destructive"
                          title="Delete vehicle"
                        >
                          <Trash2 className="h-4 w-4" />
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