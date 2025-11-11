const { StripeTransaction, User, PlanSubscription } = require('../../models');
const { Op } = require('sequelize');
const csvStringify = require('csv-stringify');

exports.index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 20;

    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.from_date && req.query.to_date) {
      where.createdAt = {
        [Op.between]: [new Date(req.query.from_date + ' 00:00:00'), new Date(req.query.to_date + ' 23:59:59')],
      };
    }

    // search by user email or name
    let include = [{ model: User, as: 'user' }, { model: PlanSubscription, as: 'plan' }];
    if (req.query.search) {
      // implement via where on included model
      include[0].where = {
        [Op.or]: [
          { email: { [Op.iLike]: `%${req.query.search}%` } },
          { name: { [Op.iLike]: `%${req.query.search}%` } },
        ],
      };
      include[0].required = true;
    }

    const { rows, count } = await StripeTransaction.findAndCountAll({
      where,
      include,
      order: [['createdAt', 'DESC']],
    });

    const stats = {
      total_revenue: await StripeTransaction.sum('amount', { where: { status: 'completed' } }),
      total_transactions: await StripeTransaction.count({ where: { status: 'completed' } }),
      pending_transactions: await StripeTransaction.count({ where: { status: 'pending' } }),
      failed_transactions: await StripeTransaction.count({ where: { status: 'failed' } }),
    };

    return res.json({ success: true, message: 'Transactions fetched successfully', data: { items: rows, stats } });
  } catch (e) {
    console.error('PurchaseHistoryController.index', e);
    return res.status(500).json({ success: false, message: 'Failed to fetch purchase history', error: e.message });
  }
};

exports.show = async (req, res) => {
  try {
    const transaction = await StripeTransaction.findByPk(req.params.id, { include: ['user', 'plan'] });
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });
    return res.json({ success: true, data: transaction });
  } catch (e) {
    console.error('PurchaseHistoryController.show', e);
    return res.status(500).json({ success: false, message: 'Failed to fetch transaction', error: e.message });
  }
};

exports.export = async (req, res) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;

    const transactions = await StripeTransaction.findAll({ where, include: ['user', 'plan'], order: [['createdAt', 'DESC']] });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="purchase-history-${new Date().toISOString()}.csv"`);

    const stringifier = csvStringify({
      header: true,
      columns: ['Transaction ID', 'User', 'Email', 'Plan', 'Amount', 'Billing Cycle', 'Status', 'Started At', 'Expires At'],
    });

    stringifier.pipe(res);
    for (const t of transactions) {
      stringifier.write([
        t.id,
        t.user ? t.user.name : '',
        t.user ? t.user.email : '',
        t.plan ? t.plan.name : '',
        (t.amount || 0).toFixed(2),
        t.billing_cycle,
        t.status,
        t.started_at ? new Date(t.started_at).toISOString() : '',
        t.expires_at ? new Date(t.expires_at).toISOString() : '',
      ]);
    }
    stringifier.end();
  } catch (e) {
    console.error('PurchaseHistoryController.export', e);
    return res.status(500).json({ success: false, message: 'Failed to export purchase history', error: e.message });
  }
};