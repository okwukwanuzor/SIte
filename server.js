const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = {
  users: [
    { id: 'u1', name: 'Avery Admin', role: 'admin', email: 'avery@site.com', active: true },
    { id: 'u2', name: 'Casey Client', role: 'client', email: 'casey@site.com', active: true },
    { id: 'u3', name: 'Cora Companion', role: 'companion', email: 'cora@site.com', active: true }
  ],
  tickets: [
    { id: 't1', clientId: 'u2', companionId: 'u3', status: 'open', priority: 'high', subject: 'Profile setup help' },
    { id: 't2', clientId: 'u2', companionId: 'u3', status: 'in_progress', priority: 'medium', subject: 'Schedule confirmation' }
  ],
  sessions: [
    { id: 's1', clientId: 'u2', companionId: 'u3', startsAt: '2026-04-23T15:00:00Z', durationMinutes: 45, status: 'scheduled' },
    { id: 's2', clientId: 'u2', companionId: 'u3', startsAt: '2026-04-24T17:30:00Z', durationMinutes: 30, status: 'scheduled' }
  ],
  notifications: [
    { id: 'n1', userId: 'u2', message: 'Your session is confirmed for Apr 23.', read: false },
    { id: 'n2', userId: 'u3', message: 'New ticket assigned: Profile setup help', read: false }
  ]
};

const byId = (id) => (entry) => entry.id === id;
const notFound = (res, entity = 'Resource') => res.status(404).json({ error: `${entity} not found` });

app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.get('/api/admin/overview', (req, res) => {
  const totalUsers = db.users.length;
  const activeUsers = db.users.filter((u) => u.active).length;
  const openTickets = db.tickets.filter((t) => t.status !== 'closed').length;
  const scheduledSessions = db.sessions.filter((s) => s.status === 'scheduled').length;

  res.json({
    metrics: { totalUsers, activeUsers, openTickets, scheduledSessions },
    recentTickets: db.tickets.slice(-5),
    users: db.users
  });
});

app.patch('/api/admin/users/:id', (req, res) => {
  const user = db.users.find(byId(req.params.id));
  if (!user) return notFound(res, 'User');

  const { active, role, name, email } = req.body;
  if (typeof active === 'boolean') user.active = active;
  if (typeof role === 'string') user.role = role;
  if (typeof name === 'string') user.name = name;
  if (typeof email === 'string') user.email = email;

  return res.json({ user });
});

app.get('/api/client/:id/dashboard', (req, res) => {
  const client = db.users.find((u) => u.id === req.params.id && u.role === 'client');
  if (!client) return notFound(res, 'Client');

  const sessions = db.sessions.filter((s) => s.clientId === client.id);
  const tickets = db.tickets.filter((t) => t.clientId === client.id);
  const notifications = db.notifications.filter((n) => n.userId === client.id);

  return res.json({ client, sessions, tickets, notifications });
});

app.post('/api/client/:id/tickets', (req, res) => {
  const client = db.users.find((u) => u.id === req.params.id && u.role === 'client');
  if (!client) return notFound(res, 'Client');

  const { subject, priority = 'medium', companionId = 'u3' } = req.body;
  if (!subject || typeof subject !== 'string') {
    return res.status(400).json({ error: 'subject is required' });
  }

  const ticket = {
    id: `t${db.tickets.length + 1}`,
    clientId: client.id,
    companionId,
    status: 'open',
    priority,
    subject
  };

  db.tickets.push(ticket);
  db.notifications.push({
    id: `n${db.notifications.length + 1}`,
    userId: companionId,
    message: `New ticket assigned: ${subject}`,
    read: false
  });

  return res.status(201).json({ ticket });
});

app.get('/api/companion/:id/dashboard', (req, res) => {
  const companion = db.users.find((u) => u.id === req.params.id && u.role === 'companion');
  if (!companion) return notFound(res, 'Companion');

  const assignedTickets = db.tickets.filter((t) => t.companionId === companion.id);
  const upcomingSessions = db.sessions.filter((s) => s.companionId === companion.id);
  const notifications = db.notifications.filter((n) => n.userId === companion.id);

  return res.json({ companion, assignedTickets, upcomingSessions, notifications });
});

app.patch('/api/companion/:id/tickets/:ticketId', (req, res) => {
  const companion = db.users.find((u) => u.id === req.params.id && u.role === 'companion');
  if (!companion) return notFound(res, 'Companion');

  const ticket = db.tickets.find((t) => t.id === req.params.ticketId && t.companionId === companion.id);
  if (!ticket) return notFound(res, 'Ticket');

  const { status, priority } = req.body;
  if (typeof status === 'string') ticket.status = status;
  if (typeof priority === 'string') ticket.priority = priority;

  return res.json({ ticket });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Dashboard service running at http://localhost:${PORT}`);
});
