// Check the structure of the latest order
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOrderStructure() {
  try {
    console.log('🔍 Fetching latest order...\n');
    
    const order = await prisma.order.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    
    if (!order) {
      console.log('❌ No orders found');
      return;
    }
    
    console.log('📋 Order Number:', order.orderNumber);
    console.log('📧 Customer Email:', order.customerEmail);
    console.log('\n📦 orderItems type:', typeof order.orderItems);
    console.log('📦 orderItems value:', JSON.stringify(order.orderItems, null, 2));
    
    console.log('\n📍 deliveryAddress type:', typeof order.deliveryAddress);
    console.log('📍 deliveryAddress value:', JSON.stringify(order.deliveryAddress, null, 2));
    
    // Test parsing
    console.log('\n🧪 Testing item parsing...');
    const items = typeof order.orderItems === 'string' ? JSON.parse(order.orderItems) : order.orderItems;
    console.log('✅ Items parsed:', items.length, 'items');
    console.log('   First item:', items[0]?.name);
    
    console.log('\n🧪 Testing delivery address parsing...');
    const address = typeof order.deliveryAddress === 'string' ? JSON.parse(order.deliveryAddress) : order.deliveryAddress;
    console.log('✅ Address parsed:', address.street, address.city);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrderStructure();
