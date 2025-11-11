const { User, StripeTransaction, PlanSubscription } = require('../../models');

exports.index = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalPlans = await PlanSubscription.count();
    const totalRevenue = await StripeTransaction.sum('amount', { where: { status: 'completed' } });

    return res.json({
      success: true,
      message: 'Admin dashboard data fetched successfully',
      data: {
        totalUsers,
        totalPlans,
        totalRevenue: parseFloat(totalRevenue || 0),
      },
    });
  } catch (e) {
    console.error('DashboardController.index', e);
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard data', error: e.message });
  }
};