const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// controllers
const DashboardController = require('../controllers/admin/DashboardController');
const PermissionController = require('../controllers/admin/PermissionController');
const RoleController = require('../controllers/admin/RoleController');
const PlanSubscriptionController = require('../controllers/admin/PlanSubscriptionController');
const ProfileController = require('../controllers/admin/ProfileController');
const PurchaseHistoryController = require('../controllers/admin/PurchaseHistoryController');
const SlotAdminController = require('../controllers/admin/SlotAdminController');
const SupportTicketAdminController = require('../controllers/admin/SupportTicketAdminController');
const UserController = require('../controllers/admin/UserController');

// Apply auth + admin role guard for all admin API routes
router.use(auth, checkRole('admin'));

// Dashboard
router.get('/dashboard', DashboardController.index);

// Permissions
router.get('/permissions', PermissionController.index);
router.post('/permissions', PermissionController.store);
router.get('/permissions/form-data', PermissionController.formData);
router.get('/permissions/by-module', PermissionController.byModule);
router.get('/permissions/:permissionId', async (req, res, next) => {
  const { Permission } = require('../models');
  const permission = await Permission.findByPk(req.params.permissionId);
  if (!permission) return res.status(404).json({ success: false, message: 'Permission not found' });
  req.permission = permission;
  next();
}, PermissionController.show);
router.put('/permissions/:permissionId', async (req, res, next) => {
  const { Permission } = require('../models');
  const permission = await Permission.findByPk(req.params.permissionId);
  if (!permission) return res.status(404).json({ success: false, message: 'Permission not found' });
  req.permission = permission;
  next();
}, PermissionController.update);
router.delete('/permissions/:permissionId', async (req, res, next) => {
  const { Permission } = require('../models');
  const permission = await Permission.findByPk(req.params.permissionId);
  if (!permission) return res.status(404).json({ success: false, message: 'Permission not found' });
  req.permission = permission;
  next();
}, PermissionController.destroy);

// Roles
router.get('/roles', RoleController.index);
router.get('/roles/form-data', RoleController.formData);
router.post('/roles', RoleController.store);
router.get('/roles/:roleId', async (req, res, next) => {
  const { Role } = require('../models');
  const role = await Role.findByPk(req.params.roleId);
  if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
  req.role = role;
  next();
}, RoleController.show);
router.put('/roles/:roleId', async (req, res, next) => {
  const { Role } = require('../models');
  const role = await Role.findByPk(req.params.roleId);
  if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
  req.role = role;
  next();
}, RoleController.update);
router.delete('/roles/:roleId', async (req, res, next) => {
  const { Role } = require('../models');
  const role = await Role.findByPk(req.params.roleId);
  if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
  req.role = role;
  next();
}, RoleController.destroy);
router.post('/roles/:roleId/assign-permission', async (req, res, next) => {
  const { Role } = require('../models');
  const role = await Role.findByPk(req.params.roleId);
  if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
  req.role = role;
  next();
}, RoleController.assignPermission);
router.post('/roles/:roleId/revoke-permission', async (req, res, next) => {
  const { Role } = require('../models');
  const role = await Role.findByPk(req.params.roleId);
  if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
  req.role = role;
  next();
}, RoleController.revokePermission);

// Plans
router.get('/plans', PlanSubscriptionController.index);
router.post('/plans', PlanSubscriptionController.store);
router.put('/plans/:planId', async (req, res, next) => {
  const { PlanSubscription } = require('../models');
  const plan = await PlanSubscription.findByPk(req.params.planId);
  if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
  req.plan = plan;
  next();
}, PlanSubscriptionController.update);
router.delete('/plans/:planId', async (req, res, next) => {
  const { PlanSubscription } = require('../models');
  const plan = await PlanSubscription.findByPk(req.params.planId);
  if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
  req.plan = plan;
  next();
}, PlanSubscriptionController.destroy);

// Profile (admin acts on self)
router.get('/profile', ProfileController.getProfile);
router.put('/profile', ProfileController.updateProfile);
router.put('/profile/password', ProfileController.updatePassword);

// Purchase history
router.get('/purchase-history', PurchaseHistoryController.index);
router.get('/purchase-history/:id', PurchaseHistoryController.show);
router.get('/purchase-history/export', PurchaseHistoryController.export);

// Slots
router.get('/slots', SlotAdminController.index);
router.post('/slots', SlotAdminController.store);
router.get('/slots/form-data', SlotAdminController.create);
router.get('/slots/:slotId', SlotAdminController.edit);
router.put('/slots/:slotId', SlotAdminController.update);
router.delete('/slots/:slotId', SlotAdminController.destroy);
router.get('/slots/:slotId/bookings', SlotAdminController.bookings);
router.post('/slots/bookings/:bookingId/cancel', SlotAdminController.cancelBooking);

// Support tickets (admin)
router.get('/support-tickets', SupportTicketAdminController.index);
router.get('/support-tickets/:ticketId', SupportTicketAdminController.show);
router.post('/support-tickets/:ticketId/reply', SupportTicketAdminController.addReply);
router.post('/support-tickets/:ticketId/status', SupportTicketAdminController.updateStatus);
router.post('/support-tickets/:ticketId/assign', SupportTicketAdminController.assign);
router.post('/support-tickets/:ticketId/priority', SupportTicketAdminController.updatePriority);

// User management
router.get('/users', UserController.index);
router.post('/users', UserController.store);
router.get('/users/:userId', async (req, res, next) => {
  const { User } = require('../models');
  const user = await User.findByPk(req.params.userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  req.userRecord = user;
  next();
}, async (req, res) => {
  const user = await require('../models').User.findByPk(req.params.userId, { include: ['Roles', 'Permissions'] });
  res.json({ success: true, data: user });
});
router.put('/users/:userId', UserController.update);
router.delete('/users/:userId', UserController.destroy);
router.post('/users/:userId/assign-role', UserController.assignRole);
router.post('/users/:userId/remove-role', UserController.removeRole);

module.exports = router;