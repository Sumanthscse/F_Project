# Sand Transport Monitoring - Backend API

This is the backend API for the Sand Transport Monitoring System, built with Node.js, Express, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   ```bash
   # Copy the example environment file
   cp env.example .env
   
   # Edit .env with your database credentials
   nano .env
   ```

3. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb sand_transport_db
   
   # Or use psql
   psql -U postgres
   CREATE DATABASE sand_transport_db;
   ```

4. **Start the server**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Database configuration
│   ├── controllers/     # Business logic
│   ├── middleware/      # Custom middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   └── index.js         # Main server file
├── package.json
├── env.example
└── README.md
```

## 🗄️ Database Models

### Users
- Authentication and authorization
- Role-based access control (admin, operator, viewer)
- Department assignment

### Vehicles
- Vehicle registration and management
- Owner information
- Status tracking (active, suspended, flagged, inactive)

### Incidents
- Incident reporting and tracking
- Severity classification
- Assignment and resolution workflow

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Vehicles
- `GET /api/vehicles` - List vehicles (with pagination & filtering)
- `POST /api/vehicles` - Register new vehicle
- `GET /api/vehicles/:id` - Get vehicle details
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle
- `PUT /api/vehicles/:id/status` - Update vehicle status

### Incidents
- `GET /api/incidents` - List incidents
- `POST /api/incidents` - Report new incident
- `PUT /api/incidents/:id` - Update incident
- `PUT /api/incidents/:id/status` - Update incident status

### Analytics & Reports
- `GET /api/analytics/dashboard` - Dashboard statistics
- `GET /api/reports/vehicles` - Vehicle reports
- `GET /api/reports/incidents` - Incident reports

## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- Rate limiting
- CORS configuration
- Helmet security headers

## 🛠️ Development

### Running Tests
```bash
npm test
```

### Database Migrations
```bash
# Sync database (creates tables)
npm run db:sync

# Force sync (drops and recreates tables)
npm run db:sync:force
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment | development |
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 5432 |
| `DB_NAME` | Database name | sand_transport_db |
| `JWT_SECRET` | JWT signing secret | - |
| `RATE_LIMIT_MAX_REQUESTS` | Rate limit requests | 100 |

## 📊 API Response Format

### Success Response
```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": [
    {
      "field": "fieldName",
      "message": "Validation error message"
    }
  ]
}
```

### Pagination Response
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

## 🔗 Frontend Integration

The frontend React app should be configured to:
- Make API calls to `http://localhost:5000/api/*`
- Include JWT token in Authorization header: `Bearer <token>`
- Handle authentication state and token refresh

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Variables
Ensure all production environment variables are set:
- Database credentials
- JWT secret
- CORS origins
- Rate limiting settings

### Process Manager
Use PM2 or similar for production:
```bash
npm install -g pm2
pm2 start src/index.js --name "sand-transport-api"
```

## 📝 License

MIT License - see LICENSE file for details


