module.exports = (permissions) => {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthenticated. Please provide a valid token.' });
    const perms = permissions.split(',').map(p => p.trim());
    const has = await req.user.hasAnyPermission(perms);
    if (!has) return res.status(403).json({ message: 'Unauthorized. You do not have the required permissions.' });
    next();
  };
};