import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Vehicle = sequelize.define('Vehicle', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  vehicleNumber: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    field: 'vehicle_number'
  },
  vehicleType: {
    type: DataTypes.ENUM('truck', 'dumper', 'trailer', 'tipper', 'other',),
    allowNull: false,
    field: 'vehicle_type'
  },
  ownerName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'owner_name'
  },
  ownerPhone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'owner_phone'
  },
  ownerAddress: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'owner_address'
  },
  licenseNumber: {
    type: DataTypes.STRING(50),
    field: 'license_number'
  },
  registrationDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'registration_date'
  },
  status: {
    type: DataTypes.ENUM('active', 'suspended', 'flagged', 'inactive'),
    defaultValue: 'active'
  },
  lastActivity: {
    type: DataTypes.DATE,
    field: 'last_activity'
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'vehicles',
  indexes: [
    {
      fields: ['vehicle_number']
    },
    {
      fields: ['owner_name']
    },
    {
      fields: ['status']
    },
    {
      fields: ['vehicle_type']
    }
  ]
});

export default Vehicle;

