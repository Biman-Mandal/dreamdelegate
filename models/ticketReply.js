const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TicketReply = sequelize.define('TicketReply', {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    support_ticket_id: { type: DataTypes.BIGINT },
    user_id: { type: DataTypes.STRING },
    message: { type: DataTypes.TEXT },
    is_admin_reply: { type: DataTypes.BOOLEAN, defaultValue: false }
  }, {
    tableName: 'ticket_replies',
    timestamps: true
  });

  return TicketReply;
};