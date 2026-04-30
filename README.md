# Smart Irrigation System

A complete, professional web application for an ESP32-based IoT Smart Irrigation project. The system monitors air temperature and soil moisture to intelligently control a water pump, conserving water and maintaining optimal plant health.

## Technology Stack

- **Frontend:** React (Vite), Tailwind CSS, Lucide React, Recharts, React Router
- **Backend:** Node.js, Express, Prisma, SQLite
- **Firmware:** C++ (Arduino framework) for ESP32

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize the database:
   ```bash
   npx prisma db push
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```
   *Note: Ensure `USE_MOCK=true` is set in `backend/.env` to simulate ESP32 data during development.*

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open the application in your browser at `http://localhost:5173`.
   *Default Login Password:* `irrigation2024`

## API Documentation

### Base URL: `http://localhost:3001`
*Except for `/api/data` and `/api/login`, all endpoints require a Bearer token in the `Authorization` header.*

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/login` | Authenticate and obtain JWT token. Body: `{ "password": "..." }` |
| `POST` | `/api/data` | Submit sensor data. Body: `{ "temperature": 28.5, "soilMoisture": 34, "pumpState": "on" }` |
| `GET` | `/api/latest` | Retrieve current real-time data and pump status. |
| `GET` | `/api/history?range={day\|week\|month}` | Retrieve historical sensor records to plot charts. |
| `POST` | `/api/pump` | Update pump mode/state. Body: `{ "state": "on" \| "off" \| "auto" }` |
| `GET` | `/api/thresholds` | Get existing temperature & moisture thresholds. |
| `POST` | `/api/thresholds` | Update operational thresholds. Body: `{ "tempThreshold": 18, "moistureThreshold": 30 }` |

## ESP32 Firmware

The `firmware` folder features the `smart_irrigation.ino` application, ready to be flashed onto an ESP32. Ensure you download the `DHT sensor library` in your Arduino IDE before compiling.
