const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SupportTicket = sequelize.define('SupportTicket', {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.STRING },
    ticket_number: { type: DataTypes.STRING },
    subject: { type: DataTypes.STRING },
    description: { type: DataTypes.TEXT },
    status: { type: DataTypes.ENUM('open','in_progress','resolved','closed'), defaultValue: 'open' },
    priority: { type: DataTypes.ENUM('low','medium','high','urgent'), defaultValue: 'medium' },
    assigned_to: { type: DataTypes.STRING, allowNull: true }
  }, {
    tableName: 'support_tickets',
    timestamps: true
  });

  SupportTicket.generateTicketNumber = async function () {
    const last = await SupportTicket.findOne({ order: [['id', 'DESC']] });
    const number = (last?.id ?? 0) + 1;
    return 'TKT-' + String(number).padStart(6, '0');
  };

  return SupportTicket;
};