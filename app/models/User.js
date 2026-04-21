const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

if (!sequelize) {
  console.error('❌ User model: Sequelize not available');
  module.exports = null;
} else {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'User'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      field: 'email'
    },
    mobileNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      field: 'mobile_number'
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_verified'
    },
    preferredChannel: {
      type: DataTypes.ENUM('sms', 'whatsapp', 'email'),
      defaultValue: 'sms',
      field: 'preferred_channel'
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'refresh_token'
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  User.prototype.hashRefreshToken = async function(token) {
    const salt = await bcrypt.genSalt(10);
    this.refreshToken = await bcrypt.hash(token, salt);
    await this.save();
  };

  User.prototype.verifyRefreshToken = async function(token) {
    if (!this.refreshToken) return false;
    return await bcrypt.compare(token, this.refreshToken);
  };

  console.log('✅ User model defined');
  module.exports = User;
}