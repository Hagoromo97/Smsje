// Quick debug script to check settings
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkSettings() {
  try {
    const result = await pool.query('SELECT * FROM settings LIMIT 1');
    console.log('\n📋 Current Settings in Database:');
    console.log('================================');
    if (result.rows.length > 0) {
      const settings = result.rows[0];
      console.log('API Key:', settings.api_key ? `${settings.api_key.substring(0, 10)}...` : 'NOT SET');
      console.log('API Endpoint:', settings.api_endpoint);
      console.log('Default Country Code:', settings.default_country_code);
      console.log('Token:', settings.token ? 'SET' : 'NOT SET');
      console.log('\n✅ Settings exist in database');
    } else {
      console.log('❌ No settings found in database');
      console.log('   Please go to Settings page and save your configuration');
    }
  } catch (error) {
    console.error('❌ Error checking settings:', error.message);
  } finally {
    await pool.end();
  }
}

checkSettings();
