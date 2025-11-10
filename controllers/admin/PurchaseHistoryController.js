const { StripeTransaction, User, PlanSubscription } = require('../../models');
const { Op } = require('sequelize');

exports.index = async (req, res) => {
  try {
    const query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.from_date && req.query.to_date) {
      query.created_at = { [Op.between]: [req.query.from_date + ' 00:00:00', req.query.to_date + ' 23:59:59'] };
    }
    const transactions = await StripeTransaction.findAll({ where: query, include: [{ model: User }, { model: PlanSubscription }], order: [['created_at','DESC']] });
    const stats = {
      total_revenue: await StripeTransaction.sum('amount', { where: { status: 'completed' } }),
      total_transactions: await StripeTransaction.count({ where: { status: 'completed' } }),
      pending_transactions: await StripeTransaction.count({ where: { status: 'pending' } }),
      failed_transactions: await StripeTransaction.count({ where: { status: 'failed' } })
    };
    return res.json({ success: true, data: { transactions, stats } });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
};

exports.show = async (req, res) => {
  const tx = await StripeTransaction.findByPk(req.params.id, { include: [{ model: User }, { model: PlanSubscription }] });
  if (!tx) return res.status(404).json({ success: false, message: 'Transaction not found' });
  return res.json({ success: true, data: tx });
};

exports.export = async (req, res) => {
  const transactions = await StripeTransaction.findAll({ include: [{ model: User }, { model: PlanSubscription }] });
  const rows = transactions.map(t => ({
    id: t.id,
    user: t.User?.name,
    email: t.User?.email,
    plan: t.PlanSubscription?.name,
    amount: t.amount,
    billing_cycle: t.billing_cycle,
    status: t.status,
    started_at: t.started_at,
    expires_at: t.expires_at
  }));
  res.json({ success: true, data: rows });
};