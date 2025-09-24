import { testConnection, syncDatabase } from './src/config/database.js';
import './src/models/User.js';
import './src/models/Vehicle.js';
import './src/models/Incident.js';

// Initialize database and start server
const initializeApp = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Sync database (create tables if they don't exist)
    await syncDatabase(false); // false = don't force recreate tables
    
    // Import and start the server
    const app = await import('./src/index.js');
    console.log('✅ Application initialized successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    process.exit(1);
  }
};

// Start the application
initializeApp();
