const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  console.log("Seeding data...");
  for (let i = 0; i < 120; i++) {
    const timestamp = new Date(now.getTime() - i * 6 * 60 * 60 * 1000);
    const temp = 20 + Math.sin(i / 10) * 10 + Math.random() * 5; 
    const moisture = 50 + Math.cos(i / 15) * 30 + Math.random() * 10;
    
    await prisma.sensorData.create({
      data: {
        timestamp,
        temperature: parseFloat(temp.toFixed(1)),
        soilMoisture: parseFloat(Math.max(0, Math.min(100, moisture)).toFixed(1))
      }
    });
  }
  console.log("Done seeding mock data.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
