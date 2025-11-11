const { SupportTicket, TicketReply, User } = require('../../models');

exports.store = async (req, res) => {
  try {
    const { subject, description, priority } = req.body;
    if (!subject || !description) return res.status(400).json({ success: false, message: 'Validation failed' });

    const user = req.user;
    const ticketNumber = await SupportTicket.generateTicketNumber();

    const ticket = await SupportTicket.create({
      user_id: user.id,
      ticket_number: ticketNumber,
      subject,
      description,
      priority: priority || 'medium',
      status: 'open',
    });

    // placeholder for email notify
    return res.status(201).json({ success: true, message: 'Support ticket created successfully', data: ticket });
  } catch (err) {
    console.error('SupportTicketController.store', err);
    return res.status(500).json({ success: false, message: 'Failed to create ticket', error: err.message });
  }
};

exports.index = async (req, res) => {
  try {
    const status = req.query.status;
    const where = { user_id: req.user.id };
    if (status) where.status = status;

    const tickets = await SupportTicket.findAll({ where, include: [{ model: TicketReply, include: [User] }, { model: User, as: 'assignedTo' }], order: [['createdAt', 'DESC']] });
    return res.json({ success: true, message: 'Tickets fetched successfully', data: tickets });
  } catch (err) {
    console.error('SupportTicketController.index', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch tickets', error: err.message });
  }
};

exports.show = async (req, res) => {
  try {
    const ticket = req.ticket;
    const user = req.user;
    const isAdmin = await user.hasRole ? await user.hasRole('admin') : false;
    if (ticket.user_id !== user.id && !isAdmin) return res.status(403).json({ success: false, message: 'Unauthorized' });

    const loaded = await SupportTicket.findByPk(ticket.id, { include: [{ model: TicketReply, include: [User] }, { model: User, as: 'assignedTo' }, { model: User, as: 'user' }] });
    return res.json({ success: true, data: loaded });
  } catch (err) {
    console.error('SupportTicketController.show', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch ticket', error: err.message });
  }
};

exports.addReply = async (req, res) => {
  try {
    const ticket = req.ticket;
    const user = req.user;
    const { message } = req.body;
    if (!message || message.length < 5) return res.status(400).json({ success: false, message: 'message required' });

    const isAdmin = await user.hasRole ? await user.hasRole('admin') : false;
    if (ticket.user_id !== user.id && !isAdmin) return res.status(403).json({ success: false, message: 'Unauthorized' });

    const reply = await TicketReply.create({ support_ticket_id: ticket.id, user_id: user.id, message, is_admin_reply: isAdmin });
    if (isAdmin) await ticket.update({ status: 'in_progress' });

    return res.status(201).json({ success: true, message: 'Reply added successfully', data: await reply.reload() });
  } catch (err) {
    console.error('SupportTicketController.addReply', err);
    return res.status(500).json({ success: false, message: 'Failed to add reply', error: err.message });
  }
};

exports.close = async (req, res) => {
  try {
    const ticket = req.ticket;
    if (ticket.user_id !== req.user.id) return res.status(403).json({ success: false, message: 'Unauthorized' });
    await ticket.update({ status: 'closed' });
    return res.json({ success: true, message: 'Ticket closed successfully', data: ticket });
  } catch (err) {
    console.error('SupportTicketController.close', err);
    return res.status(500).json({ success: false, message: 'Failed to close ticket', error: err.message });
  }
};