/**
 * middleware/checkRole.js
 * Ensures req.user has the required role name.
 */
module.exports = function checkRole(requiredRole) {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

      let roles = [];
      if (user.Roles) roles = user.Roles.map(r => r.name);
      else if (typeof user.getRoles === 'function') {
        const rs = await user.getRoles();
        roles = rs.map(r => r.name);
      }

      if (roles.includes(requiredRole)) return next();
      return res.status(403).json({ success: false, message: `Forbidden - requires role: ${requiredRole}` });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  };
};