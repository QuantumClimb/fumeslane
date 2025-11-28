import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

const order = await prisma.order.findFirst({
  where: { orderNumber: 'ORD-20251120-840' }
});

console.log(JSON.stringify(order, null, 2));
await prisma.$disconnect();
