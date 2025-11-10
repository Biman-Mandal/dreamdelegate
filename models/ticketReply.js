'use strict';

module.exports = (sequelize, DataTypes) => {
  const TicketReply = sequelize.define('TicketReply', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    support_ticket_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'support_tickets',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_admin_reply: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    tableName: 'ticket_replies',
    underscored: true,
    timestamps: true,
  });

  TicketReply.associate = function(models) {
    // Each reply belongs to a support ticket
    TicketReply.belongsTo(models.SupportTicket, {
      foreignKey: 'support_ticket_id',
      as: 'ticket',
      onDelete: 'CASCADE',
    });

    // Each reply is made by a user
    TicketReply.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
    });
  };

  return TicketReply;
};
