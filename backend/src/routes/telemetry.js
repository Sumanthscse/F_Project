import express from 'express';
import Telemetry from '../models/Telemetry.js';
import Vehicle from '../models/Vehicle.js';

const router = express.Router();

// This route accepts telemetry from the ESP32 (no auth here — add token if required)
router.post('/', async (req, res) => {
  try {
    const { truckNumber, driverName, ownerNumber, lat, lng, speed, ts } = req.body;
    if(!truckNumber || !lat || !lng) return res.status(400).json({ error: 'missing fields' });

    await Telemetry.create({
      vehicleNumber: truckNumber,
      lat, lng, speed,
      ts: ts ? new Date(ts) : undefined
    });

    // Broadcast via socket.io (we'll attach io to app.locals.io)
    const io = req.app.get('io');
    if(io) {
      io.emit('telemetry', { truckNumber, driverName, ownerNumber, lat, lng, speed, ts: Date.now() });
    }

    res.json({ status: 'ok' });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});

export default router;
