const { SupportTicket, TicketReply, User } = require('../../models');
const { Op } = require('sequelize');

exports.index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 20;
    const where = {};

    if (req.query.status) where.status = req.query.status;
    if (req.query.priority) where.priority = req.query.priority;
    if (req.query.assigned_to) where.assigned_to = req.query.assigned_to;
    if (req.query.search) {
      where[Op.or] = [
        { ticket_number: { [Op.iLike]: `%${req.query.search}%` } },
        { subject: { [Op.iLike]: `%${req.query.search}%` } },
      ];
    }

    const { rows, count } = await SupportTicket.findAndCountAll({
      where,
      include: [{ model: User, as: 'user' }, { model: User, as: 'assignedTo' }],
      order: [['createdAt', 'DESC']],
      // limit: perPage,
      // offset: (page - 1) * perPage,
    });

    const admins = await User.findAll({
      include: [{
        model: require('../../models').Role,
        where: { name: 'admin' },
        required: true,
      }],
    });

    const stats = {
      open: await SupportTicket.count({ where: { status: 'open' } }),
      in_progress: await SupportTicket.count({ where: { status: 'in_progress' } }),
      resolved: await SupportTicket.count({ where: { status: 'resolved' } }),
      closed: await SupportTicket.count({ where: { status: 'closed' } }),
    };

    return res.json({ success: true, data: { tickets: rows, stats } });
  } catch (e) {
    console.error('SupportTicketAdminController.index', e);
    return res.status(500).json({ success: false, message: 'Failed to fetch support tickets', error: e.message });
  }
};

exports.show = async (req, res) => {
  try {
    const ticket = await SupportTicket.findByPk(req.params.ticketId, { include: [{ model: TicketReply, include: [{ model: require('../../models').User }] }, { model: User, as: 'assignedTo' }, { model: User, as: 'user' }] });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const admins = await User.findAll({
      include: [{ model: require('../../models').Role, where: { name: 'admin' }, required: true }],
    });

    return res.json({ success: true, data: { ticket } });
  } catch (e) {
    console.error('SupportTicketAdminController.show', e);
    return res.status(500).json({ success: false, message: 'Failed to fetch ticket', error: e.message });
  }
};

exports.addReply = async (req, res) => {
  try {
    const ticket = await SupportTicket.findByPk(req.params.ticketId);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const { message } = req.body;
    if (!message || message.length < 5) return res.status(400).json({ success: false, message: 'message is required and must be at least 5 chars' });

    const reply = await TicketReply.create({
      support_ticket_id: ticket.id,
      user_id: req.user.id,
      message,
      is_admin_reply: true,
    });

    await ticket.update({ status: 'in_progress' });

    return res.status(201).json({ success: true, message: 'Reply added successfully', data: reply });
  } catch (e) {
    console.error('SupportTicketAdminController.addReply', e);
    return res.status(500).json({ success: false, message: 'Failed to add reply', error: e.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const ticket = await SupportTicket.findByPk(req.params.ticketId);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const { status } = req.body;
    if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

    await ticket.update({ status });
    return res.json({ success: true, message: 'Ticket status updated successfully', data: ticket });
  } catch (e) {
    console.error('SupportTicketAdminController.updateStatus', e);
    return res.status(500).json({ success: false, message: 'Failed to update status', error: e.message });
  }
};

exports.assign = async (req, res) => {
  try {
    const ticket = await SupportTicket.findByPk(req.params.ticketId);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const { assigned_to } = req.body;
    const user = await User.findByPk(assigned_to);
    if (!user) return res.status(404).json({ success: false, message: 'Assigned user not found' });

    await ticket.update({ assigned_to: user.id });
    return res.json({ success: true, message: 'Ticket assigned successfully', data: ticket });
  } catch (e) {
    console.error('SupportTicketAdminController.assign', e);
    return res.status(500).json({ success: false, message: 'Failed to assign ticket', error: e.message });
  }
};

exports.updatePriority = async (req, res) => {
  try {
    const ticket = await SupportTicket.findByPk(req.params.ticketId);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const { priority } = req.body;
    if (!['low', 'medium', 'high', 'urgent'].includes(priority)) return res.status(400).json({ success: false, message: 'Invalid priority' });

    await ticket.update({ priority });
    return res.json({ success: true, message: 'Priority updated successfully', data: ticket });
  } catch (e) {
    console.error('SupportTicketAdminController.updatePriority', e);
    return res.status(500).json({ success: false, message: 'Failed to update priority', error: e.message });
  }
};