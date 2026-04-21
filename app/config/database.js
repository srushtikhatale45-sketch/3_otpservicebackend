const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,

  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },

  // 🔥 IMPORTANT FIX
  native: false,
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Neon DB Connected');
    return true;
  } catch (error) {
    console.error('❌ DB Connection Error:', error.message);
    return false;
  }
};

module.exports = { sequelize, connectDB };