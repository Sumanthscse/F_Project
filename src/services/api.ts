// Mock API service for vehicle management
// In a real application, this would connect to the backend API

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: 'truck' | 'dumper' | 'trailer' | 'tipper' | 'other';
  capacityTons?: number;
  gpsNumber?: string;
  gpsId?: string;
  ownerName: string;
  ownerPhone: string;
  ownerAddress: string;
  licenseNumber?: string;
  registrationDate: string;
  status: 'active' | 'suspended' | 'flagged' | 'inactive';
  lastActivity?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehicleData {
  vehicleNumber: string;
  vehicleType: 'truck' | 'dumper' | 'trailer' | 'tipper' | 'other';
  capacityTons?: number;
  gpsNumber?: string;
  gpsId?: string;
  ownerName: string;
  ownerPhone: string;
  ownerAddress: string;
  licenseNumber?: string;
  registrationDate: string;
}

// Incident models (mock)
export type IncidentPriority = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'open' | 'investigating' | 'resolved';

export interface Incident {
  id: string;
  vehicleId?: string;
  vehicleNumber?: string;
  type: 'overload' | 'unauthorized_route' | 'permit_violation' | 'other';
  description: string;
  location: string;
  reportedBy: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  createdAt: string;
  updatedAt: string;
}

// Local storage key for vehicles data
const VEHICLES_STORAGE_KEY = 'sand_transport_vehicles';
const INCIDENTS_STORAGE_KEY = 'sand_transport_incidents';

// Initialize vehicles from localStorage or use default data
const initializeVehicles = (): Vehicle[] => {
  try {
    const stored = localStorage.getItem(VEHICLES_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading vehicles from localStorage:', error);
  }
  
  // Return default data if no stored data or error
  return [
    {
      id: '1',
      vehicleNumber: 'KA01AB1234',
      vehicleType: 'truck',
      capacityTons: 15,
      gpsNumber: 'GPS-0001',
      gpsId: 'A1B2C3',
      ownerName: 'Rajesh Kumar',
      ownerPhone: '+91 9876543210',
      ownerAddress: '123 Main Street, Bangalore, Karnataka',
      licenseNumber: 'DL123456789',
      registrationDate: '2024-01-15',
      status: 'active',
      lastActivity: '2024-01-20T10:30:00Z',
      createdAt: '2024-01-15T08:00:00Z',
      updatedAt: '2024-01-20T10:30:00Z'
    },
    {
      id: '2',
      vehicleNumber: 'MH02CD5678',
      vehicleType: 'dumper',
      capacityTons: 20,
      gpsNumber: 'GPS-0002',
      gpsId: 'D4E5F6',
      ownerName: 'Priya Sharma',
      ownerPhone: '+91 9876543211',
      ownerAddress: '456 Park Avenue, Mumbai, Maharashtra',
      registrationDate: '2024-01-10',
      status: 'active',
      lastActivity: '2024-01-19T14:20:00Z',
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-19T14:20:00Z'
    }
  ];
};

// Load vehicles from localStorage
let vehicles: Vehicle[] = initializeVehicles();
let incidents: Incident[] = (() => {
  try {
    const stored = localStorage.getItem(INCIDENTS_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading incidents from localStorage:', error);
  }
  return [
    {
      id: 'i1',
      vehicleId: '1',
      vehicleNumber: 'KA01AB1234',
      type: 'overload',
      description: 'Vehicle found carrying 20 tons of sand, exceeding permitted limit',
      location: 'Highway NH-48, Checkpoint 3',
      reportedBy: 'Officer Sharma',
      priority: 'high',
      status: 'investigating',
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z'
    },
    {
      id: 'i2',
      vehicleId: '2',
      vehicleNumber: 'MH02CD5678',
      type: 'unauthorized_route',
      description: 'Vehicle detected on restricted mining route without proper authorization',
      location: 'Restricted Zone A, Sector 7',
      reportedBy: 'Officer Patel',
      priority: 'critical',
      status: 'open',
      createdAt: '2024-01-14T00:00:00Z',
      updatedAt: '2024-01-14T00:00:00Z'
    },
    {
      id: 'i3',
      vehicleId: '3',
      vehicleNumber: 'KA03EF9012',
      type: 'permit_violation',
      description: 'Expired mining permit found during routine inspection',
      location: 'Mining Site B, Gate 2',
      reportedBy: 'Inspector Kumar',
      priority: 'medium',
      status: 'resolved',
      createdAt: '2024-01-13T00:00:00Z',
      updatedAt: '2024-01-13T00:00:00Z'
    }
  ];
})();

// Save vehicles to localStorage
const saveVehicles = (vehiclesToSave: Vehicle[]) => {
  try {
    localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(vehiclesToSave));
  } catch (error) {
    console.error('Error saving vehicles to localStorage:', error);
  }
};

const saveIncidents = (incidentsToSave: Incident[]) => {
  try {
    localStorage.setItem(INCIDENTS_STORAGE_KEY, JSON.stringify(incidentsToSave));
  } catch (error) {
    console.error('Error saving incidents to localStorage:', error);
  }
};

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const vehicleApi = {
  // Get all vehicles with optional filtering
  async getVehicles(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    vehicleType?: string;
  }): Promise<{ vehicles: Vehicle[]; pagination: any }> {
    await delay(500); // Simulate network delay
    
    let filteredVehicles = [...vehicles];
    
    // Apply search filter
    if (params?.search) {
      const searchTerm = params.search.toLowerCase();
      filteredVehicles = filteredVehicles.filter(vehicle =>
        vehicle.vehicleNumber.toLowerCase().includes(searchTerm) ||
        vehicle.ownerName.toLowerCase().includes(searchTerm) ||
        vehicle.ownerPhone.includes(searchTerm)
      );
    }
    
    // Apply status filter
    if (params?.status) {
      filteredVehicles = filteredVehicles.filter(vehicle => vehicle.status === params.status);
    }
    
    // Apply vehicle type filter
    if (params?.vehicleType) {
      filteredVehicles = filteredVehicles.filter(vehicle => vehicle.vehicleType === params.vehicleType);
    }
    
    // Apply pagination
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const offset = (page - 1) * limit;
    
    const paginatedVehicles = filteredVehicles.slice(offset, offset + limit);
    
    return {
      vehicles: paginatedVehicles,
      pagination: {
        page,
        limit,
        total: filteredVehicles.length,
        pages: Math.ceil(filteredVehicles.length / limit)
      }
    };
  },

  // INCIDENTS API (mock)
  async getIncidents(params?: { search?: string; status?: IncidentStatus | 'all'; }): Promise<Incident[]> {
    await delay(300);
    let list = [...incidents];
    if (params?.status && params.status !== 'all') {
      list = list.filter(i => i.status === params.status);
    }
    if (params?.search) {
      const s = params.search.toLowerCase();
      list = list.filter(i => (i.vehicleNumber || '').toLowerCase().includes(s) || i.location.toLowerCase().includes(s) || i.description.toLowerCase().includes(s));
    }
    return list;
  },

  async createIncident(data: Omit<Incident, 'id' | 'createdAt' | 'updatedAt'>): Promise<Incident> {
    await delay(500);
    const newIncident: Incident = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    incidents.unshift(newIncident);
    saveIncidents(incidents);
    return newIncident;
  },

  async updateIncident(id: string, data: Partial<Omit<Incident, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Incident | null> {
    await delay(400);
    const idx = incidents.findIndex(i => i.id === id);
    if (idx === -1) return null;
    incidents[idx] = { ...incidents[idx], ...data, updatedAt: new Date().toISOString() };
    saveIncidents(incidents);
    return incidents[idx];
  },

  async deleteIncident(id: string): Promise<boolean> {
    await delay(300);
    const idx = incidents.findIndex(i => i.id === id);
    if (idx === -1) return false;
    incidents.splice(idx, 1);
    saveIncidents(incidents);
    return true;
  },

  // Create a new vehicle
  async createVehicle(data: CreateVehicleData): Promise<Vehicle> {
    await delay(800); // Simulate network delay
    
    // Check if vehicle number already exists
    const existingVehicle = vehicles.find(v => v.vehicleNumber === data.vehicleNumber);
    if (existingVehicle) {
      throw new Error('Vehicle with this number already exists');
    }
    
    const newVehicle: Vehicle = {
      id: Date.now().toString(),
      ...data,
      status: 'active',
      lastActivity: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    vehicles.push(newVehicle);
    saveVehicles(vehicles);
    return newVehicle;
  },

  // Get vehicle by ID
  async getVehicleById(id: string): Promise<Vehicle | null> {
    await delay(300);
    return vehicles.find(vehicle => vehicle.id === id) || null;
  },

  // Update vehicle
  async updateVehicle(id: string, data: Partial<CreateVehicleData & { status?: 'active' | 'suspended' | 'flagged' | 'inactive'; notes?: string }>): Promise<Vehicle | null> {
    await delay(600);
    const vehicleIndex = vehicles.findIndex(vehicle => vehicle.id === id);
    if (vehicleIndex === -1) return null;
    
    // Check if vehicle number is being changed and if it already exists
    if (data.vehicleNumber && data.vehicleNumber !== vehicles[vehicleIndex].vehicleNumber) {
      const existingVehicle = vehicles.find(v => v.vehicleNumber === data.vehicleNumber && v.id !== id);
      if (existingVehicle) {
        throw new Error('Vehicle with this number already exists');
      }
    }
    
    vehicles[vehicleIndex] = {
      ...vehicles[vehicleIndex],
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    saveVehicles(vehicles);
    return vehicles[vehicleIndex];
  },

  // Delete vehicle
  async deleteVehicle(id: string): Promise<boolean> {
    await delay(400);
    const vehicleIndex = vehicles.findIndex(vehicle => vehicle.id === id);
    if (vehicleIndex === -1) return false;
    
    vehicles.splice(vehicleIndex, 1);
    saveVehicles(vehicles);
    return true;
  },

  // Clear all vehicles (useful for testing)
  clearAllVehicles: () => {
    vehicles = [];
    saveVehicles(vehicles);
  },

  // Reset to default vehicles
  resetToDefault: () => {
    vehicles = initializeVehicles();
    saveVehicles(vehicles);
  }
};
