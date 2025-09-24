import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { vehicleApi, CreateVehicleData } from "@/services/api";

interface VehicleRegistrationDialogProps {
  children: React.ReactNode;
  onVehicleAdded?: () => void;
}

export function VehicleRegistrationDialog({ children, onVehicleAdded }: VehicleRegistrationDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    vehicleNumber: "",
    vehicleType: "",
    capacityTons: "",
    gpsNumber: "",
    gpsId: "",
    ownerName: "",
    ownerPhone: "",
    ownerAddress: "",
    licenseNumber: "",
    registrationDate: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const vehicleData: CreateVehicleData = {
        vehicleNumber: formData.vehicleNumber,
        vehicleType: formData.vehicleType as any,
        capacityTons: formData.capacityTons ? Number(formData.capacityTons) : undefined,
        gpsNumber: formData.gpsNumber || undefined,
        gpsId: formData.gpsId || undefined,
        ownerName: formData.ownerName,
        ownerPhone: formData.ownerPhone,
        ownerAddress: formData.ownerAddress,
        licenseNumber: formData.licenseNumber || undefined,
        registrationDate: formData.registrationDate,
      };
      
      await vehicleApi.createVehicle(vehicleData);
      
      toast({
        title: "Vehicle Registered Successfully",
        description: `Vehicle ${formData.vehicleNumber} has been registered successfully.`,
      });
      
      // Reset form and close dialog
      setFormData({
        vehicleNumber: "",
        vehicleType: "",
        capacityTons: "",
        gpsNumber: "",
        gpsId: "",
        ownerName: "",
        ownerPhone: "",
        ownerAddress: "",
        licenseNumber: "",
        registrationDate: "",
      });
      setOpen(false);
      
      // Notify parent component to refresh the list
      onVehicleAdded?.();
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Failed to register vehicle. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register New Vehicle</DialogTitle>
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
            <div className="space-y-2">
              <Label htmlFor="capacityTons">Type & Capacity (tons)</Label>
              <Input
                id="capacityTons"
                type="number"
                placeholder="e.g., 15"
                value={formData.capacityTons}
                onChange={(e) => handleInputChange("capacityTons", e.target.value)}
              />
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
              <Label htmlFor="gpsNumber">GPS Number</Label>
              <Input
                id="gpsNumber"
                placeholder="Device number"
                value={formData.gpsNumber}
                onChange={(e) => handleInputChange("gpsNumber", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gpsId">GPS ID</Label>
              <Input
                id="gpsId"
                placeholder="Unique device ID"
                value={formData.gpsId}
                onChange={(e) => handleInputChange("gpsId", e.target.value)}
              />
            </div>
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

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary text-primary-foreground" disabled={isLoading}>
              {isLoading ? "Registering..." : "Register Vehicle"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}