// TSEB Schedule module — list view of gigs grouped by month
TSEB.schedule = {
  _loaded: false,
  _data: null,

  async load() {
    this._loaded = true;
    TSEB.showSkeleton('schedule-list', 4);

    const today = TSEB.util.todayStr();
    const { data: gigs, error } = await TSEB.sb.from('gigs')
      .select('*, institution:institutions(id, name, address), gig_singers(singer_id, is_anchor)')
      .gte('gig_date', today)
      .order('gig_date')
      .order('gig_time');

    if (error) {
      document.getElementById('schedule-list').innerHTML =
        '<div class="empty-state"><div class="empty-state-title">Couldn\'t load schedule</div>' +
        '<div class="empty-state-body">' + TSEB.util.esc(error.message) + '</div></div>';
      return;
    }

    this._data = gigs || [];
    this._render();
  },

  _render() {
    const el = document.getElementById('schedule-list');
    if (!el) return;

    if (!this._data || this._data.length === 0) {
      el.innerHTML =
        '<div class="empty-state">' +
        '<div class="empty-state-title">No upcoming gigs</div>' +
        '<div class="empty-state-body">Nothing scheduled yet. Once gigs are added, they\'ll appear here grouped by month.</div>' +
        '</div>';
      return;
    }

    // Group by month (YYYY-MM)
    const byMonth = {};
    this._data.forEach(function(g) {
      const month = g.gig_date.slice(0, 7);
      if (!byMonth[month]) byMonth[month] = [];
      byMonth[month].push(g);
    });

    el.innerHTML = Object.keys(byMonth).sort().map(function(month) {
      const dt = new Date(month + '-01T00:00:00');
      const monthLabel = dt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const gigs = byMonth[month];

      const gigsHTML = gigs.map(function(g) {
        const gigDt = new Date(g.gig_date + 'T00:00:00');
        const timeStr = g.gig_time ? g.gig_time.slice(0, 5) : '';
        const singers = (g.gig_singers || []).map(function(gs) {
          const name = TSEB.util.singerName(gs.singer_id);
          return gs.is_anchor
            ? '<span class="singer-chip">' + TSEB.util.esc(name) + ' <span style="font-size:11px; opacity:.7;">anchor</span></span>'
            : TSEB.util.singerChip(name);
        });

        return '<div class="card" style="cursor:pointer; margin-bottom:12px;" onclick="TSEB.schedule.showGigDetail(\'' + g.id + '\')">' +
          '<div style="display:flex; align-items:flex-start; gap:12px;">' +
          '<div style="text-align:center; min-width:48px; background:var(--primary-light); border-radius:var(--radius-sm); padding:6px 8px;">' +
          '<div style="font-size:12px; font-weight:700; text-transform:uppercase; color:var(--primary);">' + gigDt.toLocaleDateString('en-US', { weekday: 'short' }) + '</div>' +
          '<div style="font-size:22px; font-weight:700; color:var(--primary); line-height:1.1;">' + gigDt.getDate() + '</div>' +
          '</div>' +
          '<div style="flex:1;">' +
          '<div class="card-title" style="font-size:18px;">' + TSEB.util.esc(g.institution ? g.institution.name : 'Unknown Venue') + '</div>' +
          '<div class="card-detail">' +
          (timeStr ? timeStr + ' · ' : '') +
          TSEB.util.recurrenceLabel(g.recurrence) +
          (g.institution && g.institution.address ? ' · ' + TSEB.util.esc(g.institution.address) : '') +
          '</div>' +
          (singers.length
            ? '<div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:8px;">' + singers.join('') + '</div>'
            : '') +
          (g.notes ? '<div style="font-size:14px; color:var(--muted); margin-top:6px; font-style:italic;">' + TSEB.util.esc(g.notes) + '</div>' : '') +
          '</div>' +
          '</div>' +
          '</div>';
      }).join('');

      return '<div style="margin-bottom:8px;">' +
        '<h2 style="font-family:var(--font-display); font-size:20px; font-weight:600; color:var(--text); padding:16px 0 10px; border-bottom:2px solid var(--border); margin-bottom:12px;">' +
        TSEB.util.esc(monthLabel) + ' <span style="font-size:15px; font-weight:400; color:var(--muted);">(' + gigs.length + ' gig' + (gigs.length !== 1 ? 's' : '') + ')</span>' +
        '</h2>' +
        gigsHTML +
        '</div>';
    }).join('');
  },

  async showGigDetail(gigId) {
    TSEB.showDetail('<div class="modal-header"><div class="modal-title">Loading...</div></div>');

    const { data: gig, error } = await TSEB.sb.from('gigs')
      .select('*, institution:institutions(id, name, address, institution_type, contacts(first_name, last_name, job_title, phone, email, is_primary)), gig_singers(singer_id, is_anchor)')
      .eq('id', gigId).single();

    if (error || !gig) {
      TSEB.closeDetail();
      TSEB.toast('Could not load gig details', 'error');
      return;
    }

    const inst = gig.institution || {};
    const dt = new Date(gig.gig_date + 'T00:00:00');
    const dateLabel = dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const timeStr = gig.gig_time ? gig.gig_time.slice(0, 5) : '';

    const contacts = ((inst.contacts || []).slice().sort(function(a, b) {
      return (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0);
    }));

    const singers = (gig.gig_singers || []).map(function(gs) {
      const name = TSEB.util.singerName(gs.singer_id);
      return gs.is_anchor
        ? '<span class="singer-chip">' + TSEB.util.esc(name) + ' <span style="font-size:11px; opacity:.7;">anchor</span></span>'
        : TSEB.util.singerChip(name);
    });

    let contactsHTML = '';
    if (contacts.length) {
      contactsHTML = '<div style="margin-bottom:20px;">' +
        '<h4 style="font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); margin-bottom:10px;">Contacts</h4>' +
        contacts.map(function(c) {
          return '<div style="background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-sm); padding:12px; margin-bottom:8px;">' +
            '<div style="font-weight:600;">' + TSEB.util.esc(((c.first_name || '') + ' ' + (c.last_name || '')).trim()) +
            (c.is_primary ? ' <span style="font-size:11px; color:var(--accent); font-weight:700;">PRIMARY</span>' : '') + '</div>' +
            (c.job_title ? '<div style="font-size:14px; color:var(--muted);">' + TSEB.util.esc(c.job_title) + '</div>' : '') +
            '<div style="font-size:14px; margin-top:4px;">' +
            (c.phone ? '<a href="tel:' + TSEB.util.esc(c.phone) + '" style="color:var(--primary);">' + TSEB.util.esc(c.phone) + '</a>' : '') +
            (c.phone && c.email ? ' · ' : '') +
            (c.email ? '<a href="mailto:' + TSEB.util.esc(c.email) + '" style="color:var(--primary);">' + TSEB.util.esc(c.email) + '</a>' : '') +
            '</div></div>';
        }).join('') +
        '</div>';
    }

    const html =
      '<div class="modal-header">' +
      '<button class="modal-back-btn" onclick="TSEB.closeDetail()" aria-label="Close">&#8592;</button>' +
      '<div class="modal-title">' + TSEB.util.esc(inst.name || 'Gig Detail') + '</div>' +
      '</div>' +
      '<div class="modal-body">' +

      '<div style="margin-bottom:20px;">' +
      '<div style="font-family:var(--font-display); font-size:20px; font-weight:600; margin-bottom:4px;">' + TSEB.util.esc(dateLabel) + '</div>' +
      '<div style="font-size:16px; color:var(--muted);">' +
      (timeStr ? timeStr + ' · ' : '') +
      TSEB.util.recurrenceLabel(gig.recurrence) +
      '</div>' +
      (inst.address ? '<div style="font-size:15px; color:var(--muted); margin-top:4px;">' + TSEB.util.esc(inst.address) + '</div>' : '') +
      '</div>' +

      (singers.length
        ? '<div style="margin-bottom:20px;"><h4 style="font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); margin-bottom:10px;">Singers</h4>' +
          '<div style="display:flex; flex-wrap:wrap; gap:6px;">' + singers.join('') + '</div></div>'
        : '') +

      contactsHTML +

      (gig.notes
        ? '<div style="margin-bottom:20px;"><h4 style="font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); margin-bottom:10px;">Notes</h4><p style="font-size:15px;">' + TSEB.util.esc(gig.notes) + '</p></div>'
        : '') +

      (inst.id
        ? '<button class="btn btn-secondary" style="width:100%;" onclick="TSEB.closeDetail(); TSEB.outreach.showDetail(\'' + inst.id + '\')">View Facility</button>'
        : '') +

      '</div>';

    TSEB.showDetail(html);
  }
};
