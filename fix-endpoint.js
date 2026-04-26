// Update API endpoint in database from /intl to /text
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function updateEndpoint() {
  try {
    console.log('🔄 Updating API endpoint in database...\n');
    
    const result = await pool.query(
      `UPDATE settings 
       SET api_endpoint = 'https://textbelt.com/text' 
       WHERE api_endpoint = 'https://textbelt.com/intl' 
       RETURNING *`
    );
    
    if (result.rowCount > 0) {
      console.log('✅ Updated', result.rowCount, 'row(s)');
      console.log('\nNew settings:');
      console.log('  API Endpoint:', result.rows[0].api_endpoint);
      console.log('  API Key:', result.rows[0].api_key ? 'SET' : 'NOT SET');
      console.log('  Default Country:', result.rows[0].default_country_code);
    } else {
      console.log('ℹ️  No rows needed updating (already using /text endpoint)');
      
      // Check current settings
      const check = await pool.query('SELECT * FROM settings LIMIT 1');
      if (check.rows.length > 0) {
        console.log('\nCurrent settings:');
        console.log('  API Endpoint:', check.rows[0].api_endpoint);
      }
    }
    
    console.log('\n✅ Done! Restart your server to apply changes.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

updateEndpoint();
