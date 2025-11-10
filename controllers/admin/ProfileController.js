const { User } = require('../../models');
const bcrypt = require('bcrypt');

exports.edit = async (req, res) => {
  const user = req.user;
  return res.json({ success: true, data: user });
};

exports.update = async (req, res) => {
  const user = req.user;
  const { name, email, phone } = req.body;
  if (!name || !email) return res.status(422).json({ success: false, message: 'name and email required' });
  await user.update({ name, email, phone });
  return res.json({ success: true, message: 'Profile updated successfully', data: user });
};

exports.updatePassword = async (req, res) => {
  const user = req.user;
  const { current_password, password } = req.body;
  if (!current_password || !password) return res.status(422).json({ success: false, message: 'current and new password required' });
  const ok = await user.verifyPassword(current_password);
  if (!ok) return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  user.password = password;
  await user.save();
  return res.json({ success: true, message: 'Password updated successfully' });
};