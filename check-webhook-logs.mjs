// Test webhook email sending with verbose logging
import 'dotenv/config';

const WEBHOOK_URL = 'https://www.namastecurry.house/api/stripe/webhook';

// Simulate a minimal checkout.session.completed event
const fakeEvent = {
  id: 'evt_test_' + Date.now(),
  object: 'event',
  type: 'checkout.session.completed',
  data: {
    object: {
      id: 'cs_test_fake_session_for_logging',
      payment_status: 'paid',
      payment_intent: 'pi_test_fake',
      customer_email: 'juncando@gmail.com',
      metadata: {
        orderId: '36',
        orderNumber: 'ORD-20251120-555'
      }
    }
  }
};

async function testWebhook() {
  console.log('🧪 This will call the production webhook but it will fail');
  console.log('   because we need a valid Stripe signature.');
  console.log('   Instead, check the Vercel function logs at:');
  console.log('   https://vercel.com/quantum-climbs-projects/namastecurryhouse/logs');
  console.log('\nOr manually trigger a webhook from Stripe Dashboard:');
  console.log('1. Go to: https://dashboard.stripe.com/test/webhooks');
  console.log('2. Click your webhook endpoint');
  console.log('3. Click "Send test webhook"');
  console.log('4. Select "checkout.session.completed"');
  console.log('5. Check the response and logs');
}

testWebhook();
