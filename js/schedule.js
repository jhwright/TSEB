// TSEB Schedule module — calendar + list view, add gig
TSEB.schedule = {
  _loaded: false,
  _data: null,
  _calMonth: new Date().getMonth(),
  _calYear: new Date().getFullYear(),
  _calGigs: [],

  async load() {
    this._loaded = true;
    TSEB.showSkeleton('schedule-list', 4);

    var today = TSEB.util.todayStr();
    var { data: gigs, error } = await TSEB.sb.from('gigs')
      .select('*, institution:institutions(id, name, address, institution_type, contacts(first_name, last_name, job_title, phone, email, is_primary)), gig_singers(singer_id, is_anchor)')
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
    this._loadCalendar(this._calYear, this._calMonth);
  },

  _render() {
    var el = document.getElementById('schedule-list');
    if (!el) return;

    // Calendar container + list below
    var html = '<div id="cal-container" style="margin-bottom:24px;"></div>';

    if (!this._data || this._data.length === 0) {
      html += '<div class="empty-state">' +
        '<div class="empty-state-title">No upcoming gigs</div>' +
        '<div class="empty-state-body">No singing sessions scheduled yet. Tap + to add a gig.</div>' +
        '</div>';
    } else {
      // Group by month
      var byMonth = {};
      this._data.forEach(function(g) {
        var month = g.gig_date.slice(0, 7);
        if (!byMonth[month]) byMonth[month] = [];
        byMonth[month].push(g);
      });

      html += Object.keys(byMonth).sort().map(function(month) {
        var dt = new Date(month + '-01T00:00:00');
        var monthLabel = dt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        var gigs = byMonth[month];

        var gigsHTML = gigs.map(function(g) {
          var gigDt = new Date(g.gig_date + 'T00:00:00');
          var timeStr = g.gig_time ? g.gig_time.slice(0, 5) : '';
          var singers = (g.gig_singers || []).map(function(gs) {
            var name = TSEB.util.singerName(gs.singer_id);
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
    }

    el.innerHTML = html;
  },

  // ============================================================
  // CALENDAR
  // ============================================================
  _localDateStr: function(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  },

  async _loadCalendar(year, month) {
    this._calYear = year;
    this._calMonth = month;

    var first = new Date(year, month, 1);
    var last = new Date(year, month + 1, 0);
    var startDay = new Date(first);
    startDay.setDate(startDay.getDate() - first.getDay());
    var endDay = new Date(last);
    endDay.setDate(endDay.getDate() + (6 - last.getDay()));

    var { data: gigs } = await TSEB.sb.from('gigs')
      .select('*, institution:institutions(name), gig_singers(singer_id, is_anchor)')
      .gte('gig_date', this._localDateStr(startDay))
      .lte('gig_date', this._localDateStr(endDay))
      .order('gig_time');

    this._calGigs = gigs || [];
    this._renderCalendar();
  },

  _renderCalendar: function() {
    var container = document.getElementById('cal-container');
    if (!container) return;

    var today = this._localDateStr(new Date());
    var first = new Date(this._calYear, this._calMonth, 1);
    var last = new Date(this._calYear, this._calMonth + 1, 0);
    var monthLabel = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Gigs by date
    var gigsByDate = {};
    this._calGigs.forEach(function(g) {
      if (!gigsByDate[g.gig_date]) gigsByDate[g.gig_date] = [];
      gigsByDate[g.gig_date].push(g);
    });

    // Navigation
    var html = '<div style="display:flex; align-items:center; justify-content:space-between; padding:12px 0;">' +
      '<button class="btn btn-ghost" style="min-height:40px; padding:8px 14px;" onclick="TSEB.schedule.calPrev()">&lsaquo; Prev</button>' +
      '<span style="font-family:var(--font-display); font-size:20px; font-weight:600;">' + TSEB.util.esc(monthLabel) + '</span>' +
      '<button class="btn btn-ghost" style="min-height:40px; padding:8px 14px;" onclick="TSEB.schedule.calNext()">Next &rsaquo;</button>' +
      '</div>';

    // Grid
    html += '<div style="display:grid; grid-template-columns:repeat(7,1fr); gap:1px; background:var(--border); border:1px solid var(--border); border-radius:var(--radius-md); overflow:hidden;">';

    // Day headers
    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(function(d) {
      html += '<div style="background:var(--primary-light); padding:6px 4px; text-align:center; font-size:12px; font-weight:700; color:var(--primary); text-transform:uppercase;">' + d + '</div>';
    });

    // Cells
    var cursor = new Date(this._calYear, this._calMonth, 1);
    cursor.setDate(cursor.getDate() - first.getDay());
    var totalCells = Math.ceil((first.getDay() + last.getDate()) / 7) * 7;

    for (var i = 0; i < totalCells; i++) {
      var dateStr = this._localDateStr(cursor);
      var isOther = cursor.getMonth() !== this._calMonth;
      var isToday = dateStr === today;
      var dayGigs = gigsByDate[dateStr] || [];

      var bg = isToday ? 'var(--accent-light)' : 'var(--surface)';
      var opacity = isOther ? '0.4' : '1';

      html += '<div style="background:' + bg + '; padding:4px; min-height:60px; opacity:' + opacity + ';">';
      html += '<div style="font-size:13px; font-weight:' + (isToday ? '700' : '400') + '; color:' + (isToday ? 'var(--accent)' : 'var(--text)') + ';">' + cursor.getDate() + '</div>';

      dayGigs.forEach(function(g) {
        html += '<div style="font-size:11px; background:var(--primary-light); color:var(--primary); padding:1px 4px; border-radius:3px; margin-top:2px; cursor:pointer; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" ' +
          'onclick="TSEB.schedule.showGigDetail(\'' + g.id + '\')" title="' + TSEB.util.esc(g.institution ? g.institution.name : '') + '">' +
          TSEB.util.esc(g.institution ? g.institution.name : '?') +
          '</div>';
      });

      html += '</div>';
      cursor.setDate(cursor.getDate() + 1);
    }

    html += '</div>';
    container.innerHTML = html;
  },

  calPrev: function() {
    var m = this._calMonth - 1, y = this._calYear;
    if (m < 0) { m = 11; y--; }
    this._loadCalendar(y, m);
  },

  calNext: function() {
    var m = this._calMonth + 1, y = this._calYear;
    if (m > 11) { m = 0; y++; }
    this._loadCalendar(y, m);
  },

  // ============================================================
  // ADD GIG FORM
  // ============================================================
  async openAddForm() {
    // Need institution list for venue dropdown
    var { data: institutions } = await TSEB.sb.from('institutions')
      .select('id, name, status')
      .eq('status', 'active')
      .order('name');

    var instOptions = '<option value="">Select venue...</option>' +
      (institutions || []).map(function(i) {
        return '<option value="' + i.id + '">' + TSEB.util.esc(i.name) + '</option>';
      }).join('');

    var singerOptions = '<option value="">Select singer...</option>' +
      TSEB.singersCache.map(function(s) {
        return '<option value="' + s.id + '">' + TSEB.util.esc(s.first_name) + '</option>';
      }).join('');

    var html =
      '<div class="modal-header">' +
      '<button class="modal-back-btn" onclick="TSEB.closeForm()" aria-label="Cancel">&#8592;</button>' +
      '<div class="modal-title">Add Singing Session</div>' +
      '</div>' +
      '<div class="modal-body">' +
      '<form id="add-gig-form" onsubmit="event.preventDefault(); TSEB.schedule.submitAdd(this);">' +

      '<div class="form-group">' +
      '<label class="form-label">Venue</label>' +
      '<select name="institution_id" class="form-input form-select" required>' + instOptions + '</select>' +
      '</div>' +

      '<div class="form-group">' +
      '<label class="form-label">Date</label>' +
      '<input type="date" name="gig_date" class="form-input" required>' +
      '</div>' +

      '<div class="form-group">' +
      '<label class="form-label">Time</label>' +
      '<input type="time" name="gig_time" class="form-input">' +
      '</div>' +

      '<div class="form-group">' +
      '<label class="form-label">Recurrence</label>' +
      '<select name="recurrence" class="form-input form-select">' +
      '<option value="one_time">One-time</option>' +
      '<option value="weekly">Weekly</option>' +
      '<option value="biweekly">Biweekly</option>' +
      '<option value="2x_month">2x per month</option>' +
      '<option value="monthly">Monthly</option>' +
      '</select>' +
      '</div>' +

      '<div class="form-group">' +
      '<label class="form-label">Singer 1 (anchor)</label>' +
      '<select name="singer1" class="form-input form-select">' + singerOptions + '</select>' +
      '</div>' +

      '<div class="form-group">' +
      '<label class="form-label">Singer 2</label>' +
      '<select name="singer2" class="form-input form-select">' + singerOptions + '</select>' +
      '</div>' +

      '<div class="form-group">' +
      '<label class="form-label">Singer 3</label>' +
      '<select name="singer3" class="form-input form-select">' + singerOptions + '</select>' +
      '</div>' +

      '<div class="form-group">' +
      '<label class="form-label">Notes</label>' +
      '<textarea name="gig_notes" class="form-input" rows="3" placeholder="Any special notes..."></textarea>' +
      '</div>' +

      '<button type="submit" class="btn btn-primary" style="width:100%; margin-top:8px;">Schedule Gig</button>' +
      '</form>' +
      '</div>';

    TSEB.showForm(html);
  },

  async submitAdd(form) {
    var fd = new FormData(form);
    var institutionId = fd.get('institution_id');
    if (!institutionId) { TSEB.toast('Please select a venue', 'warning'); return; }
    if (!fd.get('gig_date')) { TSEB.toast('Please select a date', 'warning'); return; }

    var { data: gig, error } = await TSEB.sb.from('gigs').insert({
      institution_id: institutionId,
      gig_date: fd.get('gig_date'),
      gig_time: fd.get('gig_time') || null,
      recurrence: fd.get('recurrence'),
      notes: fd.get('gig_notes') || null
    }).select().single();

    if (error) { TSEB.toast('Error: ' + error.message, 'error'); return; }

    // Add singers
    var singerIds = [fd.get('singer1'), fd.get('singer2'), fd.get('singer3')].filter(Boolean);
    if (singerIds.length && gig) {
      await TSEB.sb.from('gig_singers').insert(
        singerIds.map(function(sid, i) {
          return { gig_id: gig.id, singer_id: sid, is_anchor: i === 0 };
        })
      );
    }

    TSEB.closeForm();
    TSEB.toast('Singing session scheduled!', 'success');
    this._loaded = false;
    this.load();
  },

  // ============================================================
  // GIG DETAIL
  // ============================================================
  async showGigDetail(gigId) {
    TSEB.showDetail('<div class="modal-header"><div class="modal-title">Loading...</div></div>');

    var { data: gig, error } = await TSEB.sb.from('gigs')
      .select('*, institution:institutions(id, name, address, institution_type, contacts(first_name, last_name, job_title, phone, email, is_primary)), gig_singers(singer_id, is_anchor)')
      .eq('id', gigId).single();

    if (error || !gig) {
      TSEB.closeDetail();
      TSEB.toast('Could not load gig details', 'error');
      return;
    }

    var inst = gig.institution || {};
    var dt = new Date(gig.gig_date + 'T00:00:00');
    var dateLabel = dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    var timeStr = gig.gig_time ? gig.gig_time.slice(0, 5) : '';

    var contacts = ((inst.contacts || []).slice().sort(function(a, b) {
      return (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0);
    }));

    var singers = (gig.gig_singers || []).map(function(gs) {
      var name = TSEB.util.singerName(gs.singer_id);
      return gs.is_anchor
        ? '<span class="singer-chip">' + TSEB.util.esc(name) + ' <span style="font-size:11px; opacity:.7;">anchor</span></span>'
        : TSEB.util.singerChip(name);
    });

    var contactsHTML = '';
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

    var html =
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
        ? '<button class="btn btn-secondary" style="width:100%;" onclick="TSEB.outreach.showDetail(\'' + inst.id + '\')">View Facility</button>'
        : '') +

      '</div>';

    TSEB.showDetail(html);
  }
};
