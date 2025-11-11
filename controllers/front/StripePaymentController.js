const Stripe = require('stripe');
const { PlanSubscription, StripeTransaction, Role, User } = require('../../models');
const jwt = require('jsonwebtoken');
const stripe = new Stripe(process.env.STRIPE_SECRET || '');

exports.createCheckoutSession = async (req, res) => {
  try {
    const { plan_id, billing_cycle, name, email, password, password_confirmation } = req.body;
    if (!plan_id || !billing_cycle) return res.status(400).json({ success: false, message: 'plan_id and billing_cycle required' });

    let user = req.user;
    let createdGuest = false, generatedPassword = null;

    if (!user) {
      if (!name || !email) return res.status(422).json({ success: false, message: 'Guest checkout requires name and email' });
      const existing = await User.findOne({ where: { email } });
      if (existing) return res.status(422).json({ success: false, message: 'Email already taken' });

      generatedPassword = password ?? '12345678';
      user = await User.create({ name, email, password: generatedPassword });
      const [clientRole] = await Role.findOrCreate({ where: { name: 'client' }, defaults: { description: 'Default client role', is_active: true } });
      await user.addRole(clientRole);
      createdGuest = true;

      // Optional: send email - omitted for brevity
    }

    const plan = await PlanSubscription.findByPk(plan_id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    const amount = billing_cycle === 'annual' ? (plan.annual_price || plan.monthly_price) : (plan.monthly_price || plan.annual_price);
    const priceId = (billing_cycle === 'annual' ? plan.stripe_price_id_annual : plan.stripe_price_id_monthly) || null;

    let lineItem = {};
    if (priceId) {
      lineItem = { price: priceId, quantity: 1 };
    } else {
      const interval = billing_cycle === 'annual' ? 'year' : 'month';
      lineItem = {
        price_data: {
          currency: plan.currency || 'usd',
          product_data: { name: plan.name, description: plan.description ?? null },
          unit_amount: Math.round((amount || 0) * 100),
          recurring: { interval },
        },
        quantity: 1,
      };
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [lineItem],
      mode: 'subscription',
      customer_email: user.email,
      success_url: (process.env.FRONTEND_URL || '') + '/payment-success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: (process.env.FRONTEND_URL || '') + '/payment-cancel',
      metadata: { user_id: user.id, plan_id: plan.id, billing_cycle }
    });

    const transaction = await StripeTransaction.create({
      user_id: user.id,
      plan_id: plan.id,
      stripe_session_id: session.id,
      amount: amount || 0,
      currency: plan.currency || 'usd',
      status: 'pending',
      billing_cycle: billing_cycle === 'annual' ? 'annual' : 'monthly',
      metadata: { product_name: plan.name },
    });

    return res.status(201).json({
      success: true,
      message: 'Checkout session created successfully',
      data: { url: session.url, session_id: session.id, transaction_id: transaction.id, user_id: user.id, guest_created: createdGuest }
    });
  } catch (err) {
    console.error('StripePaymentController.createCheckoutSession', err);
    return res.status(500).json({ success: false, message: 'Failed to create checkout session', error: err.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { session_id } = req.body;
    if (!session_id) return res.status(400).json({ success: false, message: 'session_id required' });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    if (!session.subscription) {
      return res.status(400).json({ success: false, message: 'Subscription not created yet' });
    }

    const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);
    const transaction = await StripeTransaction.findOne({ where: { stripe_session_id: session_id } });
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });

    const isActive = ['active', 'trialing'].includes(stripeSubscription.status);
    const nextBillingAt = stripeSubscription.current_period_end ? new Date(stripeSubscription.current_period_end * 1000) : null;

    await transaction.update({
      status: isActive ? 'completed' : 'pending',
      stripe_subscription_id: stripeSubscription.id,
      stripe_payment_intent_id: transaction.stripe_payment_intent_id || session.payment_intent || null,
      started_at: new Date(),
      expires_at: nextBillingAt,
    });

    return res.json({ success: true, message: 'Payment verified and subscription processed', data: { transaction_id: transaction.id, stripe_subscription_id: stripeSubscription.id, expires_at: transaction.expires_at, status: transaction.status } });
  } catch (err) {
    console.error('StripePaymentController.verifyPayment', err);
    return res.status(500).json({ success: false, message: 'Failed to verify payment', error: err.message });
  }
};

exports.getTransactionHistory = async (req, res) => {
  try {
    const transactions = await StripeTransaction.findAll({ where: { user_id: req.user.id }, include: ['plan'], order: [['createdAt', 'DESC']] });
    return res.json({ success: true, message: 'Transaction history fetched successfully', data: transactions });
  } catch (err) {
    console.error('StripePaymentController.getTransactionHistory', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch transaction history', error: err.message });
  }
};

exports.getActiveSubscription = async (req, res) => {
  try {
    const active = await StripeTransaction.findOne({ where: { user_id: req.user.id, status: 'completed' }, include: ['plan'], order: [['expires_at', 'DESC']] });
    if (!active) return res.json({ success: true, message: 'No active subscription', data: null });
    return res.json({ success: true, message: 'Active subscription fetched', data: active });
  } catch (err) {
    console.error('StripePaymentController.getActiveSubscription', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch subscription', error: err.message });
  }
};