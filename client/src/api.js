async function request(path, options) {
  const res = await fetch(path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

export function trackShipment(trackingId) {
  return request(`/api/track/${encodeURIComponent(trackingId)}`);
}

export function sendContact(payload) {
  return request('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export function sendQuote(payload) {
  return request('/api/quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

/* ------------------------------ admin API ------------------------------ */

async function adminRequest(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) throw new Error('AUTH_REQUIRED');
    throw new Error(data.error || 'Something went wrong. Please try again.');
  }
  return data;
}

// Whether the seeded default admin password is still in use (drives the
// demo-credentials hint on the login screen). Public — reveals nothing
// beyond "the default password still works".
export function adminSetupStatus() {
  return request('/api/admin/setup-status');
}

export const adminMessages = {
  list: () => adminRequest('/api/admin/messages'),
  toggle: (id) => adminRequest(`/api/admin/messages/${id}/toggle`, { method: 'POST' }),
  remove: (id) => adminRequest(`/api/admin/messages/${id}`, { method: 'DELETE' })
};

export const adminQuotes = {
  list: () => adminRequest('/api/admin/quotes'),
  toggle: (id) => adminRequest(`/api/admin/quotes/${id}/toggle`, { method: 'POST' }),
  remove: (id) => adminRequest(`/api/admin/quotes/${id}`, { method: 'DELETE' })
};

export const adminShipments = {
  list: () => adminRequest('/api/admin/shipments'),
  detail: (id) => adminRequest(`/api/admin/shipments/${id}`),
  create: (payload) =>
    adminRequest('/api/admin/shipments', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) =>
    adminRequest(`/api/admin/shipments/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  addEvent: (id, payload) =>
    adminRequest(`/api/admin/shipments/${id}/events`, { method: 'POST', body: JSON.stringify(payload) }),
  remove: (id) => adminRequest(`/api/admin/shipments/${id}`, { method: 'DELETE' }),
  notifications: (id) => adminRequest(`/api/admin/shipments/${id}/notifications`)
};
