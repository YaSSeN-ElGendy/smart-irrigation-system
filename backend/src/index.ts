import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Allow external local IP connections (like ESP32 and separate frontend port)
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const PASSWORD = process.env.DASHBOARD_PASSWORD || 'irrigation2026';

// Track ESP32 health checks globally implicitly
let lastEsp32Seen = 0;

// --- Auth Middleware ---
const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
  
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// --- Initialization ---
async function initializeDB() {
  const pumpCount = await prisma.pumpStatus.count();
  if (pumpCount === 0) {
    await prisma.pumpStatus.create({ data: { isOn: false } });
  }
  const configCount = await prisma.systemConfig.count();
  if (configCount === 0) {
    await prisma.systemConfig.create({ 
      data: { tempThreshold: 18.0, moistureThreshold: 30.0, pumpMode: 'auto' } 
    });
  }
}
initializeDB().catch(console.error);

// --- Routes ---

// 1. Authentication
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === "irrigation2026" || password === PASSWORD) { // Unconditionally accept 2026
    const token = jwt.sign({ authenticated: true }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token });
  }
  return res.status(401).json({ error: 'Invalid password' });
});

// 2. Accept Sensor Data (from ESP32 or similar)
const sensorSchema = z.object({
  temperature: z.number(),
  soilMoisture: z.number(),
  pumpState: z.string().optional(),
  mode: z.string().optional() // Optional sync argument
});

app.post('/api/data', async (req, res) => {
  const result = sensorSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid data format', details: result.error.errors });
  }
  
  // Acknowledge Health
  lastEsp32Seen = Date.now();

  const created = await prisma.sensorData.create({
    data: {
      temperature: result.data.temperature,
      soilMoisture: result.data.soilMoisture,
      pumpState: result.data.pumpState || "off"
    }
  });

  // Optimize Payload: Fetch rules/status to instantly return to ESP32 without second GET request
  const systemConfig = await prisma.systemConfig.findFirst();
  const pumpStatus = await prisma.pumpStatus.findFirst();

  return res.json({ 
     success: true,
     pumpState: pumpStatus?.isOn ? "on" : "off",
     mode: systemConfig?.pumpMode ?? "auto"
  });
});

// 3. Get Current/Latest Data
app.get('/api/latest', authenticate, async (req, res) => {
  const latest = await prisma.sensorData.findFirst({
    orderBy: { timestamp: 'desc' },
  });
  const systemConfig = await prisma.systemConfig.findFirst();
  const pumpStatus = await prisma.pumpStatus.findFirst();

  res.json({
    temperature: latest?.temperature ?? null,
    soilMoisture: latest?.soilMoisture ?? null,
    pumpState: pumpStatus?.isOn ? "on" : "off",
    mode: systemConfig?.pumpMode ?? "auto",
    timestamp: latest?.timestamp ?? new Date().toISOString()
  });
});

// 4. Get Historical Data
app.get('/api/history', authenticate, async (req, res) => {
  const range = req.query.range as string; // '24h', '7d', '30d'
  
  const now = new Date();
  let fromDate = new Date();
  
  if (range === '7d') {
    fromDate.setDate(now.getDate() - 7);
  } else if (range === '30d') {
    fromDate.setDate(now.getDate() - 30);
  } else {
    // default 24h
    fromDate.setHours(now.getHours() - 24);
  }

  const history = await prisma.sensorData.findMany({
    where: { timestamp: { gte: fromDate } },
    orderBy: { timestamp: 'asc' }
  });
  
  // Quick format history for frontend charting (averaging out if needed, but returning raw for now)
  const formattedHistory = history.map(h => ({
     time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
     moisture: h.soilMoisture,
     temperature: h.temperature
  }));
  
  res.json({ data: formattedHistory.length > 0 ? formattedHistory : [] });
});

// 5. POST Pump State (Manual override from browser dashboard)
app.post('/api/pump', authenticate, async (req, res) => {
  const { state } = req.body;
  if (!["on", "off", "auto"].includes(state)) {
    return res.status(400).json({ error: 'Invalid state. Must be "on", "off", or "auto".' });
  }
  
  const systemConfig = await prisma.systemConfig.findFirst();
  const pumpStatus = await prisma.pumpStatus.findFirst();

  if (state === "auto") {
    await prisma.systemConfig.update({
      where: { id: systemConfig!.id },
      data: { pumpMode: "auto" }
    });
  } else {
    await prisma.systemConfig.update({
      where: { id: systemConfig!.id },
      data: { pumpMode: "manual" }
    });
    const isOn = state === "on";
    await prisma.pumpStatus.update({
      where: { id: pumpStatus!.id },
      data: { isOn, lastUpdated: new Date() }
    });
  }
  
  const updatedStatus = await prisma.pumpStatus.findFirst();
  res.json({ success: true, pumpState: updatedStatus?.isOn ? "on" : "off" });
});

// 6. ESP32 Network Status Route
app.get('/api/status', authenticate, async (req, res) => {
   const now = Date.now();
   // 10 seconds of no POST = Offline
   const isConnected = (now - lastEsp32Seen) < 10000;
   res.json({
       status: "ok",
       esp32Connected: isConnected,
       lastSeen: new Date(lastEsp32Seen).toISOString()
   });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});


// Optional Mocker setup - allows easy UI testing without ESP32
if (process.env.USE_MOCK === "true") {
  console.log("MOCK MODE ENABLED: Simulating ESP32 API Calls independently...");
  setInterval(async () => {
     try {
       const systemConfig = await prisma.systemConfig.findFirst();
       const pumpStatus = await prisma.pumpStatus.findFirst();
       
       let temp = 20 + Math.random() * 5;
       let moisture = Math.max(0, 50 - Math.random() * 10);
       let pumpIsOn = pumpStatus?.isOn ?? false;
       
       if (systemConfig?.pumpMode === 'auto') {
         if (temp < systemConfig.tempThreshold || moisture < systemConfig.moistureThreshold) {
           pumpIsOn = true;
         } else {
           pumpIsOn = false;
         }
         if (pumpStatus && pumpStatus.isOn !== pumpIsOn) {
            await prisma.pumpStatus.update({
              where: { id: pumpStatus.id },
              data: { isOn: pumpIsOn }
            });
         }
       }
       
       // Call our own endpoint to hit the "lastEsp32seen" triggers and pipeline correctly
       await fetch(`http://localhost:${PORT}/api/data`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            temperature: temp, 
            soilMoisture: moisture,
            pumpState: pumpIsOn ? "on" : "off"
         })
       });
     } catch(e) {}
  }, 2000); // Polls identically to the ESP32 (every 2 seconds)
}


app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
