import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

// Use the restricted key from environment variable
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_DEV_KEY_SANDBOX, {
  apiVersion: '2024-11-20.acacia',
});

console.log('🔍 Checking recent webhook events...\n');

try {
  // Get the most recent events
  const events = await stripe.events.list({
    limit: 10,
    types: ['checkout.session.completed']
  });

  console.log(`Found ${events.data.length} recent checkout.session.completed events:\n`);

  for (const event of events.data) {
    const session = event.data.object;
    console.log(`Event ID: ${event.id}`);
    console.log(`  Created: ${new Date(event.created * 1000).toLocaleString()}`);
    console.log(`  Session ID: ${session.id}`);
    console.log(`  Payment Status: ${session.payment_status}`);
    console.log(`  Customer Email: ${session.customer_details?.email}`);
    console.log(`  Webhook Status: ${event.pending_webhooks} pending`);
    
    if (event.request && event.request.id) {
      console.log(`  Request ID: ${event.request.id}`);
    }
    
    console.log('');
  }

} catch (error) {
  console.error('Error:', error.message);
}
