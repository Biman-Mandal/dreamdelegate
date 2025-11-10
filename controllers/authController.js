const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');
const JWT_SECRET = process.env.JWT_SECRET || 'change_me';

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(422).json({ success: false, message: 'Missing required fields' });
    }
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ success: false, message: 'Email already exists' });
    const user = await User.create({ name, email, password, phone });

    let clientRole = await Role.findOne({ where: { name: 'client' } });
    if (!clientRole) clientRole = await Role.create({ name: 'client', description: 'Default client role' });
    await user.addRole(clientRole);

    const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '30d' });
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
      token
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(422).json({ success: false, message: 'Missing credentials' });
    const user = await User.findOne({ where: { email }, include: [{ model: Role, as: 'Roles' }] });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });
    const ok = await user.verifyPassword(password);
    if (!ok) return res.status(401).json({ success: false, message: 'Invalid email or password' });
    const roles = user.Roles ? user.Roles.map(r => r.name) : [];
    const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '30d' });
    // build current_plan minimal shape (can be expanded in Stripe controller)
    return res.json({
      success: true,
      message: 'Login successful',
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, roles },
      current_plan: null,
      token
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email }, include: [{ model: Role, as: 'Roles' }] });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const ok = await user.verifyPassword(password);
    if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const roles = user.Roles ? user.Roles.map(r => r.name) : [];
    if (!roles.includes('admin')) return res.status(403).json({ success: false, message: 'Forbidden: admin only' });
    const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '30d' });
    return res.json({ success: true, message: 'Admin login successful', token });
  } catch (err) {
    console.log(err)
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.logout = async (req, res) => {
  return res.json({ success: true, message: 'Logged out' });
};

exports.user = async (req, res) => {
  try {
    const user = req.user;
    const roles = user && user.getRoles ? (await user.getRoles()).map(r => r.name) : [];
    return res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, roles } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};