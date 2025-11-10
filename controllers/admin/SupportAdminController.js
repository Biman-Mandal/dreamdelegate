const { SupportTicket, TicketReply, User, Role } = require('../../models');
const { Op } = require('sequelize');

module.exports = {
  async index(req, res) {
    try {
      const { status, priority, assigned_to, search, page = 1 } = req.query;
      const where = {};
      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (assigned_to) where.assigned_to = assigned_to;
      if (search) where[Op.or] = [{ ticket_number: { [Op.iLike]: `%${search}%` } }, { subject: { [Op.iLike]: `%${search}%` } }];
      const limit = 20;
      const offset = (page - 1) * limit;
      const tickets = await SupportTicket.findAll({ where, include: [{ model: User }, { model: TicketReply, as: 'replies' }], order: [['created_at','DESC']], limit, offset });
      const stats = {
        open: await SupportTicket.count({ where: { status: 'open' } }),
        in_progress: await SupportTicket.count({ where: { status: 'in_progress' } }),
        resolved: await SupportTicket.count({ where: { status: 'resolved' } }),
        closed: await SupportTicket.count({ where: { status: 'closed' } })
      };
      return res.json({ success: true, message: 'Tickets fetched', data: { tickets, stats } });
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }
  },

  async show(req, res) {
    try {
      const ticket = await SupportTicket.findByPk(req.params.id, { include: [{ model: TicketReply, as: 'replies', include: [{ model: User, as: 'user' }] }, { model: User, as: 'assignedToUser' }, { model: User }] });
      if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
      const admins = await User.findAll({ include: [{ model: Role, as: 'Roles', where: { name: 'admin' }, required: true }] });
      return res.json({ success: true, data: { ticket, admins } });
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }
  },

  async addReply(req, res) {
    try {
      const { message } = req.body;
      if (!message) return res.status(422).json({ success: false, message: 'message is required' });
      const ticket = await SupportTicket.findByPk(req.params.id);
      if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
      const reply = await TicketReply.create({ support_ticket_id: ticket.id, user_id: req.user.id, message, is_admin_reply: true });
      await ticket.update({ status: 'in_progress' });
      return res.status(201).json({ success: true, message: 'Reply added successfully', data: reply });
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }
  },

  async updateStatus(req, res) {
    try {
      const { status } = req.body;
      if (!status) return res.status(422).json({ success: false, message: 'status is required' });
      const ticket = await SupportTicket.findByPk(req.params.id);
      if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
      await ticket.update({ status });
      return res.json({ success: true, message: 'Ticket status updated successfully', data: ticket });
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }
  },

  async assign(req, res) {
    try {
      const { assigned_to } = req.body;
      const ticket = await SupportTicket.findByPk(req.params.id);
      if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
      await ticket.update({ assigned_to });
      return res.json({ success: true, message: 'Ticket assigned successfully', data: ticket });
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }
  },

  async updatePriority(req, res) {
    try {
      const { priority } = req.body;
      if (!priority) return res.status(422).json({ success: false, message: 'priority is required' });
      const ticket = await SupportTicket.findByPk(req.params.id);
      if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
      await ticket.update({ priority });
      return res.json({ success: true, message: 'Priority updated successfully', data: ticket });
    } catch (e) {
      return res.status(400).json({ success: false, message: e.message });
    }
  }
};