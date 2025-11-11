const { PlanSubscription } = require('../../models');

exports.index = async (req, res) => {
  try {
    const plans = await PlanSubscription.findAll({ order: [['createdAt', 'DESC']] });
    return res.json({ success: true, data: plans });
  } catch (e) {
    console.error('PlanSubscriptionController.index', e);
    return res.status(500).json({ success: false, message: 'Failed to fetch plans', error: e.message });
  }
};

exports.store = async (req, res) => {
  try {
    const payload = {
      name: req.body.name,
      type: req.body.type ?? null,
      monthly_price: req.body.monthly_price ?? 0,
      annual_price: req.body.annual_price ?? 0,
      description: req.body.description ?? null,
      is_active: req.body.is_active === undefined ? true : !!req.body.is_active,
      features: req.body.features ?? [],
      additionalinfo: req.body.additionalinfo ?? [],
      billing_period: req.body.billing_period ?? 'month',
      popular: !!req.body.popular,
    };

    const plan = await PlanSubscription.create(payload);
    return res.status(201).json({ success: true, message: 'Plan created successfully', data: plan });
  } catch (e) {
    console.error('PlanSubscriptionController.store', e);
    return res.status(500).json({ success: false, message: 'Failed to create plan', error: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const plan = req.plan;
    await plan.update({
      name: req.body.name,
      type: req.body.type ?? plan.type,
      monthly_price: req.body.monthly_price ?? plan.monthly_price,
      annual_price: req.body.annual_price ?? plan.annual_price,
      description: req.body.description ?? plan.description,
      is_active: req.body.is_active === undefined ? plan.is_active : !!req.body.is_active,
      features: req.body.features ?? plan.features,
      additionalinfo: req.body.additionalinfo ?? plan.additionalinfo,
      billing_period: req.body.billing_period ?? plan.billing_period,
      popular: req.body.popular === undefined ? plan.popular : !!req.body.popular,
    });

    return res.json({ success: true, message: 'Plan updated successfully', data: plan });
  } catch (e) {
    console.error('PlanSubscriptionController.update', e);
    return res.status(500).json({ success: false, message: 'Failed to update plan', error: e.message });
  }
};

exports.destroy = async (req, res) => {
  try {
    const plan = req.plan;
    await plan.destroy();
    return res.json({ success: true, message: 'Plan deleted successfully' });
  } catch (e) {
    console.error('PlanSubscriptionController.destroy', e);
    return res.status(500).json({ success: false, message: 'Failed to delete plan', error: e.message });
  }
};