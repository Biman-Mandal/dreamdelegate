const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PlanSubscription = sequelize.define('PlanSubscription', {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING },
    type: { type: DataTypes.STRING },
    monthly_price: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
    annual_price: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
    description: { type: DataTypes.TEXT, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    features: { type: DataTypes.JSONB, allowNull: true },
    additionalinfo: { type: DataTypes.JSONB, allowNull: true },
    billing_period: { type: DataTypes.ENUM('month','year','annual'), defaultValue: 'month' },
    popular: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    tableName: 'plan_subscriptions',
    timestamps: true
  });

  PlanSubscription.prototype.apiPrice = function () {
    const period = this.billing_period || 'month';
    if (period === 'year' || period === 'annual') {
      return { price: parseFloat(this.annual_price), period: 'year' };
    }
    return { price: parseFloat(this.monthly_price), period: 'month' };
  };

  return PlanSubscription;
};