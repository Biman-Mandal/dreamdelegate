const { User } = require('../../models');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { include: ['Roles'] });
    return res.json({ success: true, data: user });
  } catch (e) {
    console.error('ProfileController.getProfile', e);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile', error: e.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    const { name, email, phone, avatarUrl } = req.body;

    if (!name || !email)
      return res.status(400).json({ success: false, message: 'name and email are required' });

    // ✅ Use Sequelize operator instead of Mongo-style
    const existing = await User.findOne({
      where: {
        email,
        id: { [Op.ne]: user.id },
      },
    });

    if (existing)
      return res.status(400).json({ success: false, message: 'Email already in use' });

    await user.update({
      name,
      email,
      phone: phone ?? user.phone,
      avatarUrl: avatarUrl ?? user.avatarUrl,
    });

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (e) {
    console.error('ProfileController.updateProfile', e);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: e.message,
    });
  }
};
exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    const { current_password, password, password_confirmation } = req.body;
    if (!current_password || !password || password !== password_confirmation) {
      return res.status(400).json({ success: false, message: 'Invalid password payload' });
    }

    const match = await bcrypt.compare(current_password, user.password);
    if (!match) return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(password, 10);
    await user.update({ password: hashed });

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (e) {
    console.error('ProfileController.updatePassword', e);
    return res.status(500).json({ success: false, message: 'Failed to update password', error: e.message });
  }
};