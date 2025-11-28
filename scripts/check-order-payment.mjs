import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function checkOrderPayment(orderNumber) {
  console.log(`🔍 Checking payment status for ${orderNumber}...\n`);
  
  try {
    // Get order from database
    const order = await prisma.order.findUnique({
      where: { orderNumber: orderNumber }
    });
    
    if (!order) {
      console.log('❌ Order not found');
      return;
    }
    
    console.log('📋 Database Order Status:');
    console.log('   Order Number:', order.orderNumber);
    console.log('   Status:', order.status);
    console.log('   Payment Status:', order.paymentStatus);
    console.log('   Stripe Session ID:', order.stripeSessionId);
    
    if (!order.stripeSessionId) {
      console.log('   ❌ No Stripe session ID linked');
      return;
    }
    
    // Get Stripe session
    console.log('\n💳 Stripe Session Status:');
    const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
    
    console.log('   Session ID:', session.id);
    console.log('   Payment Status:', session.payment_status);
    console.log('   Status:', session.status);
    console.log('   Amount Total:', `€${(session.amount_total / 100).toFixed(2)}`);
    console.log('   Customer Email:', session.customer_details?.email);
    
    if (session.payment_intent) {
      console.log('   Payment Intent:', session.payment_intent);
    }
    
    console.log('\n' + '═'.repeat(60));
    
    if (session.payment_status === 'paid' && order.status === 'PENDING') {
      console.log('⚠️  MISMATCH DETECTED!');
      console.log('   Stripe shows: PAID');
      console.log('   Database shows: PENDING');
      console.log('\n💡 This means the webhook did NOT process the payment.');
      console.log('\nPossible causes:');
      console.log('   1. Webhook URL not reachable');
      console.log('   2. Webhook signature mismatch');
      console.log('   3. Error in webhook processing code');
      console.log('   4. Database connection issue during webhook');
      
      console.log('\n🔧 To manually fix this order:');
      console.log(`   node scripts/fix-pending-orders.mjs`);
      
    } else if (session.payment_status === 'paid' && order.status === 'CONFIRMED') {
      console.log('✅ Everything is in sync!');
      console.log('   Payment successful and order confirmed.');
      
    } else if (session.payment_status !== 'paid') {
      console.log('⏳ Payment not completed yet');
      console.log(`   Status: ${session.payment_status}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Get order number from command line or use latest
const orderNumber = process.argv[2] || 'ORD-20251115-277';
checkOrderPayment(orderNumber);
