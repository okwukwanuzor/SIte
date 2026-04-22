const state = {
  clientId: 'u2',
  companionId: 'u3'
};

const tabs = document.querySelectorAll('.tab');
const panels = {
  admin: document.getElementById('admin-panel'),
  client: document.getElementById('client-panel'),
  companion: document.getElementById('companion-panel')
};

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    Object.values(panels).forEach((p) => p.classList.add('hidden'));
    panels[tab.dataset.tab].classList.remove('hidden');
  });
});

const renderList = (elementId, values, mapper) => {
  const target = document.getElementById(elementId);
  target.innerHTML = values.map(mapper).map((html) => `<li>${html}</li>`).join('') || '<li>No records found</li>';
};

async function loadAdmin() {
  const response = await fetch('/api/admin/overview');
  const data = await response.json();

  const metrics = document.getElementById('admin-metrics');
  metrics.innerHTML = Object.entries(data.metrics)
    .map(([label, value]) => `
      <article class="card">
        <div class="label">${label}</div>
        <div class="value">${value}</div>
      </article>
    `)
    .join('');

  renderList('admin-users', data.users, (user) => `${user.name} — ${user.role} (${user.active ? 'active' : 'inactive'})`);
}

async function loadClient() {
  const response = await fetch(`/api/client/${state.clientId}/dashboard`);
  const data = await response.json();

  renderList('client-sessions', data.sessions, (s) => `${new Date(s.startsAt).toLocaleString()} • ${s.durationMinutes} min • ${s.status}`);
  renderList('client-tickets', data.tickets, (t) => `${t.subject} • ${t.priority} • ${t.status}`);
}

async function loadCompanion() {
  const response = await fetch(`/api/companion/${state.companionId}/dashboard`);
  const data = await response.json();

  renderList('companion-tickets', data.assignedTickets, (t) => `${t.subject} • ${t.priority} • ${t.status}`);
  renderList('companion-sessions', data.upcomingSessions, (s) => `${new Date(s.startsAt).toLocaleString()} • ${s.durationMinutes} min • ${s.status}`);
}

document.getElementById('new-ticket-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const subject = document.getElementById('subject').value.trim();
  if (!subject) return;

  await fetch(`/api/client/${state.clientId}/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject })
  });

  document.getElementById('subject').value = '';
  await Promise.all([loadClient(), loadCompanion(), loadAdmin()]);
});

Promise.all([loadAdmin(), loadClient(), loadCompanion()]);
