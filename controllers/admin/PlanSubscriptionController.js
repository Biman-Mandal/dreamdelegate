const { PlanSubscription } = require('../../models');

exports.index = async (req, res) => {
  const plans = await PlanSubscription.findAll();
  return res.json({ success: true, data: plans });
};

exports.store = async (req, res) => {
  const payload = req.body;
  const plan = await PlanSubscription.create(payload);
  return res.status(201).json({ success: true, data: plan });
};

exports.update = async (req, res) => {
  const plan = await PlanSubscription.findByPk(req.params.id);
  if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
  await plan.update(req.body);
  return res.json({ success: true, data: plan });
};

exports.destroy = async (req, res) => {
  const plan = await PlanSubscription.findByPk(req.params.id);
  if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
  await plan.destroy();
  return res.json({ success: true, message: 'Plan deleted successfully' });
};