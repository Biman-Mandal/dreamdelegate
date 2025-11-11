const { User, StripeTransaction, PlanSubscription } = require('../../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';
const TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN || '30d';

async function pickUserResponse(user) {
  const roles = await user.getRoles().then(r => r.map(x => x.name));
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    roles,
  };
}

exports.register = async (req, res) => {
  try {
    const { name, email, password, password_confirmation, phone } = req.body;
    if (!name || !email || !password || password !== password_confirmation) {
      return res.status(400).json({ success: false, message: 'Validation failed' });
    }

    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(400).json({ success: false, message: 'Email already taken' });

    const user = await User.create({ name, email, phone: phone ?? null, password });
    const [clientRole] = await Role.findOrCreate({
      where: { name: 'client' },
      defaults: { description: 'Default client role', is_active: true },
    });

    // Attach pivot role if available
    await user.addRole(clientRole);

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    // active subscription
    const activeSubscription = await StripeTransaction.findOne({
      where: { user_id: user.id, status: 'completed' },
      include: ['plan'],
      order: [['expires_at', 'DESC']],
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: await pickUserResponse(user),
      current_plan: activeSubscription,
      token,
    });
  } catch (err) {
    console.error('AuthController.register', err);
    return res.status(500).json({ success: false, message: 'Registration failed', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Validation failed' });

    const user = await User.findOne({ where: { email } });
    if (!user)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    // MFA enforcement
    if (['owner', 'staff'].includes(user.role) && !user.mfa_enabled) {
      return res.status(403).json({
        success: false,
        message: 'MFA required for owner/staff accounts. Please enable MFA.',
        mfa_required: true,
      });
    }

    // Update last login timestamp
    await user.update({ lastLoginAt: new Date() });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

    // ✅ Fetch active plan subscription with alias "plan"
    const activeSubscription = await StripeTransaction.findOne({
      where: { user_id: user.id, status: 'completed' },
      include: [{ model: PlanSubscription, as: 'plan' }],
      order: [['expires_at', 'DESC']],
    });

    return res.json({
      success: true,
      message: 'Login successful',
      user: await pickUserResponse(user),
      current_plan: activeSubscription,
      token,
    });
  } catch (err) {
    console.error('AuthController.login', err);
    return res.status(500).json({
      success: false,
      message: 'Login failed',
      error: err.message,
    });
  }
};
exports.logout = async (req, res) => {
  // Stateless JWT: instruct client to remove token.
  return res.json({ success: true, message: 'Logged out successfully' });
};

exports.user = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthenticated' });

    const roles = await user.getRoles().then(r => r.map(x => x.name));
    const permissions = await user.getPermissions().then(p => p.map(x => x.name));

    const activeSubscription = await StripeTransaction.findOne({
      where: { user_id: user.id, status: 'completed' },
      include: ['plan'],
      order: [['expires_at', 'DESC']],
    });

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        roles,
        permissions,
        avatarUrl: user.avatarUrl,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
      },
      current_plan: activeSubscription,
    });
  } catch (err) {
    console.error('AuthController.user', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch user', error: err.message });
  }
};