const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

if (!sequelize) {
  console.error('❌ OTP model: Sequelize not available');
  module.exports = null;
} else {
  const OTP = sequelize.define('OTP', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    contact: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'contact'
    },
    otpCode: {
      type: DataTypes.STRING(6),
      allowNull: false,
      field: 'otp_code'
    },
    channel: {
      type: DataTypes.ENUM('sms', 'whatsapp', 'email'),
      defaultValue: 'sms',
      field: 'channel'
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_verified'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at'
    },
    attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    tableName: 'otp_verifications',
    timestamps: false,
    underscored: true
  });

  console.log('✅ OTP model defined');
  module.exports = OTP;
}