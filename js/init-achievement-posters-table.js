/**
 * Database Initialization Script for achievement_posters table
 * 
 * This script ensures the achievement_posters table exists with the correct schema.
 * Run this script once to set up the database table before using the poster publish feature.
 * 
 * Usage:
 *   node init-achievement-posters-table.js
 */

const LetmetryAPI = require('./letmetry-cloud-api.js');

async function initAchievementPostersTable() {
  console.log('🔧 Initializing achievement_posters table...\n');

  try {
    // Check if table exists
    console.log('Step 1: Checking if table exists...');
    const tableCheckSql = "SHOW TABLES LIKE 'achievement_posters'";
    const existingTables = await LetmetryAPI.queryMysql(tableCheckSql);
    
    if (existingTables && existingTables.length > 0) {
      console.log('✅ Table achievement_posters already exists.\n');
      
      // Verify table structure
      console.log('Step 2: Verifying table structure...');
      const describeResult = await LetmetryAPI.queryMysql('DESCRIBE achievement_posters');
      console.log('Current table structure:');
      console.table(describeResult);
      
      // Check for required columns
      const requiredColumns = ['id', 'image_url', 'title', 'user_name', 'museum_id', 'age_group', 'visibility', 'created_at'];
      const existingColumns = describeResult.map(col => col.Field);
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
      
      if (missingColumns.length > 0) {
        console.warn('⚠️  Warning: Missing columns:', missingColumns.join(', '));
        console.log('\nTable needs manual migration. Please contact the administrator.');
        return false;
      }
      
      console.log('✅ Table structure is correct.\n');
      return true;
    }

    // Table doesn't exist, create it
    console.log('ℹ️  Table does not exist. Creating...\n');
    
    const createTableSql = `
      CREATE TABLE achievement_posters (
        id INT PRIMARY KEY AUTO_INCREMENT,
        image_url VARCHAR(500),
        title VARCHAR(200),
        user_name VARCHAR(100),
        museum_id VARCHAR(100),
        age_group VARCHAR(20),
        visibility VARCHAR(20) DEFAULT 'public',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_visibility (visibility),
        INDEX idx_museum_id (museum_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `;
    
    await LetmetryAPI.queryMysql(createTableSql);
    console.log('✅ Table achievement_posters created successfully!\n');
    
    // Verify creation
    const verifyResult = await LetmetryAPI.queryMysql('DESCRIBE achievement_posters');
    console.log('Verified table structure:');
    console.table(verifyResult);
    
    return true;
  } catch (error) {
    console.error('❌ Error initializing table:', error.message);
    if (error.sqlMessage) {
      console.error('SQL Error:', error.sqlMessage);
    }
    return false;
  }
}

// Run if executed directly
if (require.main === module) {
  initAchievementPostersTable()
    .then(success => {
      if (success) {
        console.log('\n🎉 Database initialization completed successfully!');
        process.exit(0);
      } else {
        console.log('\n❌ Database initialization failed.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n❌ Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { initAchievementPostersTable };
