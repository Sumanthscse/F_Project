import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { vehicleApi, Vehicle, CreateVehicleData } from "@/services/api";

interface EditVehicleDialogProps {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVehicleUpdated?: () => void;
}

export function EditVehicleDialog({ vehicle, open, onOpenChange, onVehicleUpdated }: EditVehicleDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    vehicleNumber: "",
    vehicleType: "",
    ownerName: "",
    ownerPhone: "",
    ownerAddress: "",
    licenseNumber: "",
    registrationDate: "",
    status: "active",
    notes: "",
  });

  // Update form data when vehicle changes
  useEffect(() => {
    if (vehicle) {
      setFormData({
        vehicleNumber: vehicle.vehicleNumber,
        vehicleType: vehicle.vehicleType,
        ownerName: vehicle.ownerName,
        ownerPhone: vehicle.ownerPhone,
        ownerAddress: vehicle.ownerAddress,
        licenseNumber: vehicle.licenseNumber || "",
        registrationDate: vehicle.registrationDate,
        status: vehicle.status,
        notes: vehicle.notes || "",
      });
    }
  }, [vehicle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle) return;
    
    setIsLoading(true);
    
    try {
      const updateData: Partial<CreateVehicleData & { status?: 'active' | 'suspended' | 'flagged' | 'inactive'; notes?: string }> = {
        vehicleNumber: formData.vehicleNumber,
        vehicleType: formData.vehicleType as any,
        ownerName: formData.ownerName,
        ownerPhone: formData.ownerPhone,
        ownerAddress: formData.ownerAddress,
        licenseNumber: formData.licenseNumber || undefined,
        registrationDate: formData.registrationDate,
        status: formData.status,
        notes: formData.notes,
      };
      
      await vehicleApi.updateVehicle(vehicle.id, updateData);
      
      toast({
        title: "Vehicle Updated Successfully",
        description: `Vehicle ${formData.vehicleNumber} has been updated successfully.`,
      });
      
      onVehicleUpdated?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update vehicle. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!vehicle) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Vehicle - {vehicle.vehicleNumber}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicleNumber">Vehicle Number *</Label>
              <Input
                id="vehicleNumber"
                placeholder="e.g., KA01AB1234"
                value={formData.vehicleNumber}
                onChange={(e) => handleInputChange("vehicleNumber", e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vehicleType">Vehicle Type *</Label>
              <Select 
                value={formData.vehicleType} 
                onValueChange={(value) => handleInputChange("vehicleType", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="truck">Truck</SelectItem>
                  <SelectItem value="dumper">Dumper</SelectItem>
                  <SelectItem value="trailer">Trailer</SelectItem>
                  <SelectItem value="tipper">Tipper</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ownerName">Owner Name *</Label>
              <Input
                id="ownerName"
                placeholder="Full name of vehicle owner"
                value={formData.ownerName}
                onChange={(e) => handleInputChange("ownerName", e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ownerPhone">Owner Phone *</Label>
              <Input
                id="ownerPhone"
                placeholder="Contact number"
                value={formData.ownerPhone}
                onChange={(e) => handleInputChange("ownerPhone", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownerAddress">Owner Address *</Label>
            <Textarea
              id="ownerAddress"
              placeholder="Complete address"
              value={formData.ownerAddress}
              onChange={(e) => handleInputChange("ownerAddress", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">License Number</Label>
              <Input
                id="licenseNumber"
                placeholder="Driving license number"
                value={formData.licenseNumber}
                onChange={(e) => handleInputChange("licenseNumber", e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="registrationDate">Registration Date *</Label>
              <Input
                id="registrationDate"
                type="date"
                value={formData.registrationDate}
                onChange={(e) => handleInputChange("registrationDate", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about the vehicle"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Vehicle"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
