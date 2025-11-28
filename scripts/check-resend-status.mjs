import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

async function checkDetailedStatus() {
  console.log('🔍 Checking Resend Domain Status...\n');
  
  try {
    const domains = await resend.domains.list();
    
    if (!domains.data || domains.data.data.length === 0) {
      console.log('❌ No domains found');
      return;
    }
    
    const domain = domains.data.data.find(d => d.name === 'namastecurry.house');
    
    if (!domain) {
      console.log('❌ Domain namastecurry.house not found');
      return;
    }
    
    console.log('📋 Domain Details:');
    console.log('═'.repeat(60));
    console.log('Name:', domain.name);
    console.log('Status:', domain.status);
    console.log('Created:', new Date(domain.created_at).toLocaleString());
    console.log('Region:', domain.region);
    
    if (domain.records) {
      console.log('\n📝 DNS Records Status:');
      console.log('─'.repeat(60));
      
      domain.records.forEach(record => {
        const statusIcon = record.status === 'verified' ? '✅' : 
                          record.status === 'pending' ? '⏳' : 
                          record.status === 'failed' ? '❌' : '❓';
        
        console.log(`\n${statusIcon} ${record.record_type} (${record.record})`);
        console.log(`   Status: ${record.status}`);
        console.log(`   Name: ${record.name}`);
        console.log(`   Value: ${record.value.substring(0, 50)}${record.value.length > 50 ? '...' : ''}`);
        
        if (record.status === 'failed') {
          console.log(`   ⚠️  This record needs attention`);
        }
      });
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('\n💡 Next Steps:');
    if (domain.status === 'verified') {
      console.log('   ✅ Domain is verified! You can now send emails.');
    } else if (domain.status === 'pending') {
      console.log('   ⏳ Verification in progress. Wait a few minutes and check again.');
    } else {
      console.log('   ❌ Verification failed. Check individual record statuses above.');
      console.log('   - Ensure all DNS records match exactly');
      console.log('   - Wait 15-30 minutes after DNS changes');
      console.log('   - Try verification again: node scripts/verify-resend-domain.mjs');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

checkDetailedStatus();
