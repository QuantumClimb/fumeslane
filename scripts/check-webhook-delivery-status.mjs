import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function checkWebhookDelivery() {
  console.log('🔍 Checking webhook delivery for latest order...\n');
  
  try {
    // Get recent events
    const events = await stripe.events.list({ 
      limit: 10,
      types: ['checkout.session.completed']
    });
    
    console.log(`📊 Found ${events.data.length} recent checkout.session.completed events:\n`);
    
    for (const event of events.data) {
      const session = event.data.object;
      console.log('═'.repeat(70));
      console.log(`Event ID: ${event.id}`);
      console.log(`Session ID: ${session.id}`);
      console.log(`Payment Status: ${session.payment_status}`);
      console.log(`Amount: €${(session.amount_total / 100).toFixed(2)}`);
      console.log(`Created: ${new Date(event.created * 1000).toLocaleString()}`);
      console.log(`Customer Email: ${session.customer_details?.email || session.customer_email}`);
      
      // Note: We can't get webhook delivery attempts via API
      // User needs to check Stripe Dashboard
      console.log(`\n📍 Check delivery status at:`);
      console.log(`   https://dashboard.stripe.com/test/events/${event.id}`);
      console.log('');
    }
    
    console.log('═'.repeat(70));
    console.log('\n💡 To see webhook delivery status:');
    console.log('   1. Go to: https://dashboard.stripe.com/test/webhooks/we_1SQshX4AYllAtAxreGYjEA8w');
    console.log('   2. Look for events from the last few minutes');
    console.log('   3. Click on each event to see:');
    console.log('      - HTTP Status Code (200 = success, 400/500 = error)');
    console.log('      - Response body');
    console.log('      - Error messages if any');
    console.log('\n🔍 What to look for:');
    console.log('   - ✅ Status 200 + { "received": true } = Webhook working but silent failure in processing');
    console.log('   - ❌ Status 400 = Signature verification failed');
    console.log('   - ❌ Status 500 = Server error in webhook handler');
    console.log('   - ⏱️  Timeout = Webhook URL not reachable\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkWebhookDelivery();
