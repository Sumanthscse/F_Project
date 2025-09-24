import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Incident = sequelize.define('Incident', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  vehicleId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'vehicle_id',
    references: {
      model: 'vehicles',
      key: 'id'
    }
  },
  incidentType: {
    type: DataTypes.ENUM('violation', 'accident', 'overloading', 'illegal_mining', 'other'),
    allowNull: false,
    field: 'incident_type'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  incidentDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'incident_date'
  },
  severity: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium'
  },
  status: {
    type: DataTypes.ENUM('reported', 'investigating', 'resolved', 'closed'),
    defaultValue: 'reported'
  },
  reportedBy: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'reported_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  assignedTo: {
    type: DataTypes.UUID,
    field: 'assigned_to',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  resolutionNotes: {
    type: DataTypes.TEXT,
    field: 'resolution_notes'
  },
  evidenceFiles: {
    type: DataTypes.JSON,
    field: 'evidence_files'
  },
  estimatedDamage: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'estimated_damage'
  }
}, {
  tableName: 'incidents',
  indexes: [
    {
      fields: ['vehicle_id']
    },
    {
      fields: ['incident_type']
    },
    {
      fields: ['status']
    },
    {
      fields: ['severity']
    },
    {
      fields: ['incident_date']
    },
    {
      fields: ['reported_by']
    }
  ]
});

export default Incident;

