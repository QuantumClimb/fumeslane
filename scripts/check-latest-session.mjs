import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

const sessionId = 'cs_test_b1iz3MxqR6HAF8yRlX62klw0PzhHzqLuKHiWjqdQFIyZnjR0xJoMBuibou';

const order = await prisma.order.findFirst({
  where: { stripeSessionId: sessionId }
});

if (order) {
  console.log(`Order Number: ${order.orderNumber}`);
  console.log(`Status: ${order.status}`);
  console.log(`Payment Status: ${order.paymentStatus}`);
  console.log(`Created: ${order.createdAt}`);
  console.log(`Updated: ${order.updatedAt}`);
  console.log(`Confirmed At: ${order.confirmedAt}`);
} else {
  console.log('Order not found');
}

await prisma.$disconnect();
