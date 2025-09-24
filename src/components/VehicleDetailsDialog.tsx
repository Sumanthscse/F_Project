import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Vehicle } from "@/services/api";

interface VehicleDetailsDialogProps {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VehicleDetailsDialog({ vehicle, open, onOpenChange }: VehicleDetailsDialogProps) {
  if (!vehicle) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'flagged':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vehicle Details - {vehicle.vehicleNumber}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Vehicle Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Vehicle Number</label>
                <p className="text-lg font-semibold">{vehicle.vehicleNumber}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Vehicle Type</label>
                <p className="text-lg capitalize">{vehicle.vehicleType}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Registration Date</label>
                <p className="text-lg">{formatDate(vehicle.registrationDate)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <Badge className={getStatusColor(vehicle.status)}>
                    {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Activity</label>
                <p className="text-lg">
                  {vehicle.lastActivity ? formatDate(vehicle.lastActivity) : 'Never'}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="text-lg">{formatDate(vehicle.createdAt)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="text-lg">{formatDate(vehicle.updatedAt)}</p>
              </div>
            </div>
          </div>

          {/* Owner Information */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Owner Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Owner Name</label>
                <p className="text-lg font-medium">{vehicle.ownerName}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                <p className="text-lg">{vehicle.ownerPhone}</p>
              </div>
              
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">Address</label>
                <p className="text-lg">{vehicle.ownerAddress}</p>
              </div>
              
              {vehicle.licenseNumber && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">License Number</label>
                  <p className="text-lg">{vehicle.licenseNumber}</p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {vehicle.notes && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Notes</h3>
              <p className="text-lg">{vehicle.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
