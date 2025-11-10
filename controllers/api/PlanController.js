const { PlanSubscription } = require('../../models');

exports.index = async (req, res) => {
  const plans = await PlanSubscription.findAll({ where: { is_active: true } });
  return res.json({ success: true, data: plans });
};

exports.current = async (req, res) => {
  // placeholder: implement logic to fetch current active subscription for req.user
  return res.json({ success: true, data: null });
};