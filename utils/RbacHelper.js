const { Role, Permission } = require('../models');

module.exports = {
  getAllRoles: async () => Role.findAll({ where: { is_active: true } }),
  getAllPermissions: async () => Permission.findAll({ where: { is_active: true } }),
  getPermissionsByModule: async (module) => Permission.findAll({ where: { module, is_active: true } }),
  getRoleByName: async (name) => Role.findOne({ where: { name } }),
  getPermissionByName: async (name) => Permission.findOne({ where: { name } }),
  createRoleWithPermissions: async (name, description = null, permissionIds = []) => {
    const role = await Role.create({ name, description, is_active: true });
    if (permissionIds.length) await role.setPermissions(permissionIds);
    return role;
  }
};