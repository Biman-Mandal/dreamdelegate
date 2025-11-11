const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const User = require('./User')(sequelize);
const Role = require('./Role')(sequelize);
const Permission = require('./Permission')(sequelize);
const RolePermission = require('./RolePermission')(sequelize);
const UserRole = require('./UserRole')(sequelize);
const PlanSubscription = require('./PlanSubscription')(sequelize);
const StripeTransaction = require('./StripeTransaction')(sequelize);
const Slot = require('./Slot')(sequelize);
const SlotBooking = require('./SlotBooking')(sequelize);
const SupportTicket = require('./SupportTicket')(sequelize);
const TicketReply = require('./TicketReply')(sequelize);

// --- Associations ---

// Roles & Permissions
Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'role_id', otherKey: 'permission_id' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permission_id', otherKey: 'role_id' });

// Users & Roles
User.belongsToMany(Role, { through: UserRole, foreignKey: 'user_id', otherKey: 'role_id' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'role_id', otherKey: 'user_id' });

// Direct user permissions
const UserPermission = require('./UserPermission')(sequelize);
User.belongsToMany(Permission, { through: UserPermission, foreignKey: 'user_id', otherKey: 'permission_id' });
Permission.belongsToMany(User, { through: UserPermission, foreignKey: 'permission_id', otherKey: 'user_id' });

// Plans & Stripe Transactions
PlanSubscription.hasMany(StripeTransaction, { foreignKey: 'plan_id', as: 'transactions' });
StripeTransaction.belongsTo(PlanSubscription, { foreignKey: 'plan_id', as: 'plan' }); // ✅ Added alias
StripeTransaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(StripeTransaction, { foreignKey: 'user_id', as: 'transactions' });

// Slots & Bookings
Slot.hasMany(SlotBooking, { foreignKey: 'slot_id', as: 'bookings' });
SlotBooking.belongsTo(Slot, { foreignKey: 'slot_id', as: 'slot' });
SlotBooking.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(SlotBooking, { foreignKey: 'user_id', as: 'slotBookings' });

// Support Tickets
SupportTicket.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
SupportTicket.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignedTo' });
SupportTicket.hasMany(TicketReply, { foreignKey: 'support_ticket_id', as: 'replies' });
TicketReply.belongsTo(SupportTicket, { foreignKey: 'support_ticket_id', as: 'ticket' });
TicketReply.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  Sequelize,
  User,
  Role,
  Permission,
  RolePermission,
  UserRole,
  UserPermission,
  PlanSubscription,
  StripeTransaction,
  Slot,
  SlotBooking,
  SupportTicket,
  TicketReply
};
