import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

try {
  const session = await stripe.checkout.sessions.retrieve(
    'cs_test_b1Iy8FoXf4HeLN5OltYaCpgNfLRhg2X1zuyO5kK1YhGhhLfAj2J7vbt3Zi'
  );
  
  console.log('Session Details:');
  console.log('================');
  console.log('Session ID:', session.id);
  console.log('Payment Status:', session.payment_status);
  console.log('Status:', session.status);
  console.log('\n🔗 URLs:');
  console.log('Success URL:', session.success_url);
  console.log('Cancel URL:', session.cancel_url);
  console.log('\nCreated:', new Date(session.created * 1000).toLocaleString());
  
} catch (error) {
  console.error('Error:', error.message);
}
