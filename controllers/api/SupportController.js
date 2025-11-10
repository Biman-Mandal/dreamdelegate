const { SupportTicket, TicketReply, User } = require('../../models');

module.exports = {
  async createTicket(req, res) {
    try {
      const { subject, description, priority } = req.body;
      if (!subject || !description) return res.status(422).json({ success: false, message: 'subject and description are required' });
      const user = req.user;
      const ticketNumber = `TCKT-${Date.now()}-${Math.floor(Math.random()*1000)}`;
      const ticket = await SupportTicket.create({
        user_id: user.id,
        ticket_number: ticketNumber,
        subject,
        description,
        priority: priority || 'medium',
        status: 'open'
      });
      return res.status(201).json({ success: true, message: 'Support ticket created successfully', data: ticket });
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Failed to create ticket: ' + e.message });
    }
  },

  async listTickets(req, res) {
    try {
      const user = req.user;
      const status = req.query.status;
      const where = { user_id: user.id };
      if (status) where.status = status;
      const tickets = await SupportTicket.findAll({
        where,
        include: [{ model: TicketReply, as: 'replies', include: [{ model: User, as: 'user' }] }, { model: User, as: 'assignedToUser' }],
        order: [['created_at', 'DESC']]
      });
      return res.json({ success: true, message: 'Tickets fetched successfully', data: tickets });
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Failed to fetch tickets: ' + e.message });
    }
  },

  async showTicket(req, res) {
    try {
      const ticket = await SupportTicket.findByPk(req.params.id, {
        include: [{ model: TicketReply, as: 'replies', include: [{ model: User, as: 'user' }] }, { model: User, as: 'assignedToUser' }, { model: User }]
      });
      if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
      const roles = (await req.user.getRoles()).map(r => r.name);
      if (ticket.user_id !== req.user.id && !roles.includes('admin')) return res.status(403).json({ success: false, message: 'Unauthorized' });
      return res.json({ success: true, data: ticket });
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Failed to fetch ticket: ' + e.message });
    }
  },

  async replyTicket(req, res) {
    try {
      const { message } = req.body;
      if (!message) return res.status(422).json({ success: false, message: 'message is required' });
      const ticket = await SupportTicket.findByPk(req.params.id);
      if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
      const roles = (await req.user.getRoles()).map(r => r.name);
      if (ticket.user_id !== req.user.id && !roles.includes('admin')) return res.status(403).json({ success: false, message: 'Unauthorized' });
      const reply = await TicketReply.create({
        support_ticket_id: ticket.id,
        user_id: req.user.id,
        message,
        is_admin_reply: roles.includes('admin')
      });
      if (roles.includes('admin')) await ticket.update({ status: 'in_progress' });
      const loaded = await TicketReply.findByPk(reply.id, { include: [{ model: User, as: 'user' }] });
      return res.status(201).json({ success: true, message: 'Reply added successfully', data: loaded });
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Failed to add reply: ' + e.message });
    }
  },

  async closeTicket(req, res) {
    try {
      const ticket = await SupportTicket.findByPk(req.params.id);
      if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
      if (ticket.user_id !== req.user.id) return res.status(403).json({ success: false, message: 'Unauthorized' });
      await ticket.update({ status: 'closed' });
      return res.json({ success: true, message: 'Ticket closed successfully', data: ticket });
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Failed to close ticket: ' + e.message });
    }
  }
};