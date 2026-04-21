const { sequelize, connectDB } = require('./app/config/database');

async function testConnection() {
  console.log('🔍 Testing Database Connection...\n');
  
  const connected = await connectDB();
  
  if (connected && sequelize) {
    console.log('\n✅ Database connection successful!');
    
    // Check if tables exist
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('\n📊 Tables in database:', tables);
    
  } else {
    console.log('\n❌ Database connection failed');
  }
  
  setTimeout(() => process.exit(0), 2000);
}

testConnection();