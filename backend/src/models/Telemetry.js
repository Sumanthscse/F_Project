import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Telemetry = sequelize.define('Telemetry', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  vehicleNumber: { type: DataTypes.STRING(50), allowNull: false, field: 'vehicle_number' },
  lat: { type: DataTypes.DOUBLE, allowNull: false },
  lng: { type: DataTypes.DOUBLE, allowNull: false },
  speed: { type: DataTypes.DOUBLE, allowNull: true },
  ts: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
}, {
  tableName: 'telemetry'
});

export default Telemetry;
