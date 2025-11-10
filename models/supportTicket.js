'use strict';
/**
 * Sequelize SupportTicket model
 */
module.exports = (sequelize, DataTypes) => {
  const SupportTicket = sequelize.define('SupportTicket', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER },
    ticket_number: { type: DataTypes.STRING },
    subject: { type: DataTypes.STRING },
    description: { type: DataTypes.TEXT },
    status: { type: DataTypes.ENUM('open','in_progress','resolved','closed'), defaultValue: 'open' },
    priority: { type: DataTypes.ENUM('low','medium','high','urgent'), defaultValue: 'medium' },
    assigned_to: { type: DataTypes.INTEGER }
  }, {
    tableName: 'support_tickets',
    underscored: true,
    timestamps: true
  });

  SupportTicket.associate = function(models) {
    SupportTicket.belongsTo(models.User, { foreignKey: 'user_id' });
    SupportTicket.belongsTo(models.User, { foreignKey: 'assigned_to', as: 'assignedToUser' });
    SupportTicket.hasMany(models.TicketReply, { foreignKey: 'support_ticket_id', as: 'replies' });
  };

  SupportTicket.generateTicketNumber = function() {
    return `TCKT-${Date.now()}-${Math.floor(Math.random()*1000)}`;
  };

  return SupportTicket;
};