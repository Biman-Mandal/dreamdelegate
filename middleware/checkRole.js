module.exports = (roles) => {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthenticated. Please provide a valid token.' });
    const roleArray = roles.split(',').map(r => r.trim());
    const has = await req.user.hasRole(roleArray);
    // if (!has) return res.status(403).json({ message: 'Unauthorized. You do not have the required role.' });
    next();
  };
};