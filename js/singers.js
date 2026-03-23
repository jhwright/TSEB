// TSEB Singers module — volunteer roster view
TSEB.singers = {
  _loaded: false,

  load() {
    this._loaded = true;
    this._render();
  },

  _render() {
    const headerEl = document.getElementById('singers-header');
    const listEl = document.getElementById('singers-list');
    const data = TSEB.singersCache;

    // Header: show available count
    if (headerEl) {
      const available = data.filter(function(s) { return s.availability === 'available'; });
      const limited = data.filter(function(s) { return s.availability === 'limited'; });
      headerEl.innerHTML =
        '<div style="display:flex; gap:12px; flex-wrap:wrap;">' +
        '<span class="badge badge-active">' + available.length + ' available</span>' +
        (limited.length ? '<span class="badge badge-conversation">' + limited.length + ' limited</span>' : '') +
        '<span style="font-size:15px; color:var(--muted); align-self:center;">' + data.length + ' total</span>' +
        '</div>';
    }

    if (!listEl) return;

    if (data.length === 0) {
      listEl.innerHTML =
        '<div class="empty-state">' +
        '<div class="empty-state-title">No singers yet</div>' +
        '<div class="empty-state-body">The singer roster is empty. Singers can be added via the database.</div>' +
        '</div>';
      return;
    }

    // Group by availability
    const groups = {
      available: { label: 'Available', badge: 'badge-active', items: [] },
      limited: { label: 'Limited Availability', badge: 'badge-conversation', items: [] },
      unavailable: { label: 'Unavailable', badge: 'badge-muted', items: [] }
    };

    data.forEach(function(s) {
      const key = s.availability || 'unavailable';
      if (groups[key]) groups[key].items.push(s);
      else groups.unavailable.items.push(s);
    });

    listEl.innerHTML = Object.keys(groups).map(function(key) {
      const group = groups[key];
      if (group.items.length === 0) return '';

      const cardsHTML = group.items.map(function(s) {
        return TSEB.singers._cardHTML(s);
      }).join('');

      return '<div style="margin-bottom:24px;">' +
        '<h3 style="font-size:15px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); margin-bottom:10px;">' +
        group.label + ' <span class="badge ' + group.badge + '">' + group.items.length + '</span>' +
        '</h3>' +
        cardsHTML +
        '</div>';
    }).join('');
  },

  _cardHTML(s) {
    const roleLabel = s.role === 'both'
      ? '<span class="badge badge-active">Singer</span> <span class="badge badge-initial">Outreacher</span>'
      : s.role === 'singer'
        ? '<span class="badge badge-active">Singer</span>'
        : '<span class="badge badge-initial">Outreacher</span>';

    return '<div class="card" style="margin-bottom:10px;">' +
      '<div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">' +
      '<div style="font-family:var(--font-display); font-size:20px; font-weight:600;">' + TSEB.util.esc(s.first_name) + '</div>' +
      '<div style="display:flex; gap:6px; flex-wrap:wrap;">' + roleLabel + '</div>' +
      '</div>' +
      (s.preferred_days
        ? '<div style="font-size:14px; color:var(--muted); margin-top:4px;">Available: ' + TSEB.util.esc(s.preferred_days) + '</div>'
        : '') +
      (s.notes
        ? '<div style="font-size:14px; color:var(--muted); margin-top:6px; font-style:italic;">' + TSEB.util.esc(s.notes) + '</div>'
        : '') +
      '</div>';
  }
};
