const { PlanSubscription } = require('../../models');
const StripeTransaction = require('../../models').StripeTransaction;

exports.index = async (req, res) => {
  try {
    const user = req.user;
    const plans = await PlanSubscription.findAll();

    const result = await Promise.all(plans.map(async (plan) => {
      let isPurchased = false;
      if (user) {
        const found = await StripeTransaction.findOne({
          where: { user_id: user.id, plan_id: plan.id, status: 'completed' },
          order: [['expires_at', 'DESC']],
        });
        isPurchased = !!found;
      }
      const apiPrice = plan.apiPrice ? plan.apiPrice() : { price: parseFloat(plan.monthly_price || 0), period: 'month' };
      return {
        id: plan.id,
        name: plan.name,
        name_period: (plan.name + '_' + apiPrice.period).toLowerCase(),
        price: apiPrice.price,
        period: apiPrice.period,
        shortDescription: plan.description,
        features: plan.features || [],
        additionalinfo: plan.additionalinfo || [],
        popular: !!plan.popular,
        monthly_price: plan.monthly_price,
        annual_price: plan.annual_price,
        billing_period: plan.billing_period || 'month',
        is_purchased: !!isPurchased,
      };
    }));

    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('PlanSubscriptionController.index', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch plans', error: err.message });
  }
};