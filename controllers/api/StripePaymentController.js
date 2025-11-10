const Stripe = require('stripe');
const { StripeTransaction, PlanSubscription, User } = require('../../models');
const stripe = new Stripe(process.env.STRIPE_SECRET || '');
const { Op } = require('sequelize');

exports.webhook = async (req, res) => {
  // webhook raw handling should be implemented in express route with raw body
  return res.status(200).send('webhook received');
};

exports.createCheckoutSession = async (req, res) => {
  return res.status(501).json({ success: false, message: 'Not implemented - integrate Stripe SDK' });
};

exports.verifyPayment = async (req, res) => {
  return res.status(501).json({ success: false, message: 'Not implemented - integrate Stripe SDK' });
};

exports.getTransactionHistory = async (req, res) => {
  const user = req.user;
  const txs = await StripeTransaction.findAll({ where: { user_id: user.id }, order: [['created_at', 'DESC']] });
  return res.json({ success: true, message: 'Transaction history fetched successfully', data: txs });
};

exports.getActiveSubscription = async (req, res) => {
  const user = req.user;
  const active = await StripeTransaction.findOne({
    where: { user_id: user.id, status: 'completed', [Op.or]: [{ expires_at: null }, { expires_at: { [Op.gt]: new Date() } }] },
    order: [['expires_at', 'DESC']]
  });
  return res.json({ success: true, message: 'Active subscription fetched', data: active || null });
};