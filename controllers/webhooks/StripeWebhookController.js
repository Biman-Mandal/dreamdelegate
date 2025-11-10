const { StripeTransaction } = require('../../models');

exports.handle = async (req, res) => {
  // For production, verify signature with stripe.webhooks.constructEvent
  // This is a basic placeholder to update transaction by session id passed in webhook payload
  try {
    const event = req.body;
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const transaction = await StripeTransaction.findOne({ where: { stripe_session_id: session.id } });
      if (transaction) {
        await transaction.update({ status: 'completed' });
      }
    }
    return res.status(200).send('Webhook processed');
  } catch (e) {
    return res.status(400).send('Webhook error: ' + e.message);
  }
};