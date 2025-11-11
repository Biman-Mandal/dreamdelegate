const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const StripeTransaction = sequelize.define('StripeTransaction', {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.STRING },
    plan_id: { type: DataTypes.BIGINT },
    stripe_session_id: { type: DataTypes.STRING, unique: true },
    stripe_subscription_id: { type: DataTypes.STRING, allowNull: true },
    stripe_payment_intent_id: { type: DataTypes.STRING, allowNull: true },
    amount: { type: DataTypes.DECIMAL(10,2) },
    currency: { type: DataTypes.STRING, defaultValue: 'usd' },
    status: { type: DataTypes.ENUM('pending','completed','failed','refunded'), defaultValue: 'pending' },
    billing_cycle: { type: DataTypes.ENUM('monthly','annual'), defaultValue: 'monthly' },
    started_at: { type: DataTypes.DATE, allowNull: true },
    expires_at: { type: DataTypes.DATE, allowNull: true },
    metadata: { type: DataTypes.JSONB, allowNull: true }
  }, {
    tableName: 'stripe_transactions',
    timestamps: true
  });

  StripeTransaction.prototype.isExpired = function () {
    return this.expires_at && new Date(this.expires_at) < new Date();
  };

  StripeTransaction.prototype.isActive = function () {
    return this.status === 'completed' && !this.isExpired();
  };

  return StripeTransaction;
};