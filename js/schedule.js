// TSEB Schedule module — Plainchant: Calendar / Agenda / Map view picker
TSEB.schedule = {
  _loaded: false,
  _data: null,
  _calMonth: new Date().getMonth(),
  _calYear: new Date().getFullYear(),
  _view: null,
  _map: null,
  _institutions: null,

  // East Bay zip code centroids — used to plot gigs on the map.
  _zipCoords: {
    '94563': { lat: 37.8809, lng: -122.1797 },
    '94568': { lat: 37.7022, lng: -121.9358 },
    '94577': { lat: 37.7164, lng: -122.1525 },
    '94578': { lat: 37.7044, lng: -122.1131 },
    '94601': { lat: 37.7740, lng: -122.2202 },
    '94602': { lat: 37.8027, lng: -122.2078 },
    '94609': { lat: 37.8338, lng: -122.2649 },
    '94611': { lat: 37.8309, lng: -122.2364 },
    '94612': { lat: 37.8088, lng: -122.2691 },
    '94704': { lat: 37.8669, lng: -122.2587 },
    '94705': { lat: 37.8584, lng: -122.2470 },
    '94706': { lat: 37.8908, lng: -122.2965 }
  },

  _readView: function() {
    try { return localStorage.getItem('tseb-schedule-view') || 'calendar'; }
    catch (e) { return 'calendar'; }
  },

  _writeView: function(v) {
    try { localStorage.setItem('tseb-schedule-view', v); } catch (e) {}
  },

  setView: function(v) {
    this._view = v;
    this._writeView(v);
    this._render();
  },

  async load() {
    this._loaded = true;
    this._view = this._readView();
    TSEB.showSkeleton('schedule-list', 4);

    var today = TSEB.util.todayStr();
    var { data: gigs, error } = await TSEB.sb.from('gigs')
      .select('*, institution:institutions(id, name, address, zip_code, institution_type, contacts(first_name, last_name, job_title, phone, email, is_primary)), gig_singers(singer_id, is_anchor)')
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

  _render: function() {
    var el = document.getElementById('schedule-list');
    if (!el) return;

    if (!this._data) this._data = [];

    var picker = this._pickerHTML();
    var body = '';
    if (this._view === 'agenda') body = this._agendaHTML();
    else if (this._view === 'map') body = this._mapHTML();
    else body = this._calendarHTML();

    el.innerHTML = picker + body;

    // Map needs to be initialized after the DOM is in place.
    if (this._view === 'map') this._initMap();
  },

  _pickerHTML: function() {
    var view = this._view;
    var opts = [
      { id: 'calendar', label: 'Calendar' },
      { id: 'agenda',   label: 'Agenda' },
      { id: 'map',      label: 'Map' }
    ];
    var btns = opts.map(function(o) {
      var cls = 'sched-picker-btn' + (view === o.id ? ' is-active' : '');
      return '<button class="' + cls + '" onclick="TSEB.schedule.setView(\'' + o.id + '\')">' +
        TSEB.util.esc(o.label) + '</button>';
    }).join('');

    return '<div class="sched-picker">' +
      '<div class="eyebrow">Your schedule view</div>' +
      '<div class="sched-picker-grid">' + btns + '</div>' +
      '<div class="sched-picker-hint">Tap to switch &middot; we\'ll remember your favorite</div>' +
      '</div>';
  },

  // ============================================================
  // CALENDAR VIEW
  // ============================================================
  _localDateStr: function(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  },

  _calendarHTML: function() {
    var year = this._calYear, month = this._calMonth;
    var first = new Date(year, month, 1);
    var last = new Date(year, month + 1, 0);
    var monthLabel = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    var todayStr = this._localDateStr(new Date());

    var prevMonth = new Date(year, month - 1, 1);
    var nextMonth = new Date(year, month + 1, 1);
    var prevLabel = prevMonth.toLocaleDateString('en-US', { month: 'short' });
    var nextLabel = nextMonth.toLocaleDateString('en-US', { month: 'short' });

    // Gigs by date for THIS month grid.
    var monthFirst = this._localDateStr(first);
    var monthLast = this._localDateStr(last);
    var gigsByDate = {};
    this._data.forEach(function(g) {
      if (g.gig_date >= monthFirst && g.gig_date <= monthLast) {
        if (!gigsByDate[g.gig_date]) gigsByDate[g.gig_date] = [];
        gigsByDate[g.gig_date].push(g);
      }
    });

    var html = '<div class="sched-cal-head">' +
      '<button class="sched-cal-nav" onclick="TSEB.schedule.calPrev()">&lsaquo; ' + TSEB.util.esc(prevLabel) + '</button>' +
      '<div class="sched-cal-month">' +
        '<div class="eyebrow">In the month of</div>' +
        '<h2 class="sched-cal-month-name">' + TSEB.util.esc(monthLabel) + '</h2>' +
      '</div>' +
      '<button class="sched-cal-nav" onclick="TSEB.schedule.calNext()">' + TSEB.util.esc(nextLabel) + ' &rsaquo;</button>' +
      '</div>';

    html += '<div class="sched-cal-grid">';
    ['S','M','T','W','T','F','S'].forEach(function(d) {
      html += '<div class="sched-cal-dow">' + d + '</div>';
    });

    // Leading blanks for first.getDay() (0=Sun)
    var startBlanks = first.getDay();
    for (var b = 0; b < startBlanks; b++) {
      html += '<div class="sched-cal-cell is-other"></div>';
    }
    var daysInMonth = last.getDate();
    for (var d = 1; d <= daysInMonth; d++) {
      var dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      var isToday = dateStr === todayStr;
      var dayGigs = gigsByDate[dateStr] || [];
      var has = dayGigs.length > 0;
      var cls = 'sched-cal-cell';
      if (isToday) cls += ' is-today';
      if (has) cls += ' has-gig';
      var click = has ? ' onclick="TSEB.schedule.showGigDetail(\'' + dayGigs[0].id + '\')"' : '';
      html += '<div class="' + cls + '"' + click + '>' +
        '<span class="sched-cal-num">' + d + '</span>' +
        (has ? '<span class="sched-cal-dot"></span>' : '') +
        '</div>';
    }

    html += '</div>';

    // Upcoming list below grid — for current and future months only.
    var todayD = new Date();
    todayD.setHours(0, 0, 0, 0);
    var upcoming = this._data.filter(function(g) {
      var dt = new Date(g.gig_date + 'T00:00:00');
      return dt >= todayD;
    }).slice(0, 6);

    if (upcoming.length) {
      html += '<hr class="h-rule" style="margin:12px 22px;"/>';
      html += '<div class="sched-upcoming">';
      html += '<div class="eyebrow sched-upcoming-eyebrow">Upcoming gigs</div>';
      html += upcoming.map(function(g) { return TSEB.schedule._upcomingRow(g); }).join('');
      html += '</div>';
    }

    return html;
  },

  _upcomingRow: function(g) {
    var dt = new Date(g.gig_date + 'T00:00:00');
    var dow = dt.toLocaleDateString('en-US', { weekday: 'short' });
    var day = dt.getDate();
    var timeStr = g.gig_time ? TSEB.util.fmtTime(g.gig_time) : '';
    var venue = g.institution ? g.institution.name : 'Unknown venue';
    var singerCount = (g.gig_singers || []).length;
    var meta = (timeStr ? timeStr : '') +
      (timeStr && singerCount ? ' &middot; ' : '') +
      (singerCount ? singerCount + ' singer' + (singerCount === 1 ? '' : 's') : '');

    var singers = (g.gig_singers || []).map(function(gs) {
      return '<span class="sched-singer-chip">' + TSEB.util.esc(TSEB.util.singerName(gs.singer_id)) + '</span>';
    }).join('');

    return '<div class="sched-upcoming-row" onclick="TSEB.schedule.showGigDetail(\'' + g.id + '\')">' +
      '<div class="sched-upcoming-date">' +
        '<div class="sched-upcoming-dow">' + TSEB.util.esc(dow) + '</div>' +
        '<div class="sched-upcoming-day">' + day + '</div>' +
      '</div>' +
      '<div class="sched-upcoming-body">' +
        '<div class="sched-upcoming-venue">' + TSEB.util.esc(venue) + '</div>' +
        '<div class="sched-upcoming-meta">' + meta + '</div>' +
        (singers ? '<div class="sched-upcoming-singers">' + singers + '</div>' : '') +
      '</div>' +
      '</div>';
  },

  calPrev: function() {
    var m = this._calMonth - 1, y = this._calYear;
    if (m < 0) { m = 11; y--; }
    this._calYear = y;
    this._calMonth = m;
    this._render();
  },

  calNext: function() {
    var m = this._calMonth + 1, y = this._calYear;
    if (m > 11) { m = 0; y++; }
    this._calYear = y;
    this._calMonth = m;
    this._render();
  },

  // ============================================================
  // AGENDA VIEW
  // ============================================================
  _agendaHTML: function() {
    var todayD = new Date();
    todayD.setHours(0, 0, 0, 0);
    var list = this._data.filter(function(g) {
      var dt = new Date(g.gig_date + 'T00:00:00');
      return dt >= todayD;
    });

    var html = '<div class="sched-agenda-head">' +
      '<div class="eyebrow sched-agenda-eyebrow">Schedule</div>' +
      '<h2 class="sched-agenda-title">The coming weeks</h2>' +
      '</div>';

    if (!list.length) {
      html += '<div class="empty-state">' +
        '<div class="empty-state-title">No upcoming gigs</div>' +
        '<div class="empty-state-body">Tap + to schedule one.</div>' +
        '</div>';
      return html;
    }

    html += '<div class="sched-tl-list">' +
      list.map(function(g) { return TSEB.schedule._timelineRow(g, null); }).join('') +
      '</div>';

    return html;
  },

  _timelineRow: function(g, num) {
    var dt = new Date(g.gig_date + 'T00:00:00');
    var monthShort = dt.toLocaleDateString('en-US', { month: 'short' });
    var day = dt.getDate();
    var dow = dt.toLocaleDateString('en-US', { weekday: 'long' });
    var timeStr = g.gig_time ? TSEB.util.fmtTime(g.gig_time) : '';
    var venue = g.institution ? g.institution.name : 'Unknown venue';
    var rec = TSEB.util.recurrenceLabel(g.recurrence) || '';
    var meta = (timeStr ? timeStr : '') +
      (timeStr && rec ? ' &middot; ' : '') +
      (rec ? rec : '');

    var singerNames = (g.gig_singers || []).map(function(gs) {
      return TSEB.util.singerName(gs.singer_id);
    }).join(' &middot; ');

    var ruleCls = 'sched-tl-rule' + (num != null ? ' is-numbered' : '');
    var ruleAttrs = num != null ? ' data-num="' + num + '"' : '';

    return '<div class="sched-tl-row" onclick="TSEB.schedule.showGigDetail(\'' + g.id + '\')">' +
      '<div class="sched-tl-date">' +
        '<div class="sched-tl-month">' + TSEB.util.esc(monthShort) + '</div>' +
        '<div class="sched-tl-day">' + day + '</div>' +
        '<div class="sched-tl-dow">' + TSEB.util.esc(dow) + '</div>' +
      '</div>' +
      '<div class="' + ruleCls + '"' + ruleAttrs + '></div>' +
      '<div class="sched-tl-body">' +
        '<div class="sched-tl-venue">' + TSEB.util.esc(venue) + '</div>' +
        '<div class="sched-tl-meta">' + meta + '</div>' +
        (singerNames ? '<div class="sched-tl-singers">' + singerNames + '</div>' : '') +
        (g.notes ? '<div class="sched-tl-notes">' + TSEB.util.esc(g.notes) + '</div>' : '') +
      '</div>' +
      '</div>';
  },

  // ============================================================
  // MAP VIEW
  // ============================================================
  _mapHTML: function() {
    var todayD = new Date();
    todayD.setHours(0, 0, 0, 0);
    var list = this._data.filter(function(g) {
      var dt = new Date(g.gig_date + 'T00:00:00');
      return dt >= todayD;
    }).slice(0, 6);

    var html = '<div class="sched-map-head">' +
      '<div class="eyebrow sched-map-eyebrow">Schedule &middot; Map</div>' +
      '<h2 class="sched-map-title">Gigs on the map</h2>' +
      '</div>' +
      '<div id="sched-map-canvas" class="sched-map-canvas"></div>';

    if (!list.length) {
      html += '<div class="empty-state">' +
        '<div class="empty-state-title">No upcoming gigs</div>' +
        '<div class="empty-state-body">Tap + to schedule one.</div>' +
        '</div>';
      return html;
    }

    html += '<div class="sched-tl-list">' +
      list.map(function(g, i) { return TSEB.schedule._timelineRow(g, i + 1); }).join('') +
      '</div>';

    return html;
  },

  _initMap: function() {
    var el = document.getElementById('sched-map-canvas');
    if (!el || typeof L === 'undefined') return;

    if (this._map) {
      try { this._map.remove(); } catch (e) {}
      this._map = null;
    }

    var todayD = new Date();
    todayD.setHours(0, 0, 0, 0);
    var list = this._data.filter(function(g) {
      var dt = new Date(g.gig_date + 'T00:00:00');
      return dt >= todayD;
    }).slice(0, 6);

    var map = L.map(el, { zoomControl: false, attributionControl: true }).setView([37.84, -122.26], 11);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OSM, &copy; CartoDB',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    var bounds = [];
    list.forEach(function(g, i) {
      var zip = g.institution && g.institution.zip_code;
      var c = zip && TSEB.schedule._zipCoords[zip];
      if (!c) return;
      // Jitter overlapping pins so multiple gigs in same zip stay distinguishable.
      var jitter = 0.004 * (i % 4);
      var lat = c.lat + jitter * (i % 2 === 0 ? 1 : -1);
      var lng = c.lng + jitter * (i % 2 === 0 ? -1 : 1);
      var dt = new Date(g.gig_date + 'T00:00:00');
      var dateStr = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      var html = '<div class="tseb-pin-inner"><span class="n">' + (i + 1) + '</span><span class="d">' + TSEB.util.esc(dateStr) + '</span></div>';
      var icon = L.divIcon({ className: 'tseb-pin', html: html, iconSize: [null, null], iconAnchor: [22, 14] });
      var m = L.marker([lat, lng], { icon: icon }).addTo(map);
      m.on('click', function() { TSEB.schedule.showGigDetail(g.id); });
      bounds.push([lat, lng]);
    });

    if (bounds.length) {
      try { map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 }); } catch (e) {}
    }

    this._map = map;
    setTimeout(function() { try { map.invalidateSize(); } catch (e) {} }, 100);
  },

  // ============================================================
  // ADD / EDIT / DETAIL — manuscript style
  // ============================================================
  async openAddForm() {
    var { data: institutions } = await TSEB.sb.from('institutions')
      .select('id, name, status')
      .in('status', ['active', 'site_visit', 'in_conversation'])
      .order('name');

    var instOptions = '<option value="">Select venue&hellip;</option>' +
      (institutions || []).map(function(i) {
        return '<option value="' + i.id + '">' + TSEB.util.esc(i.name) + '</option>';
      }).join('');

    var singerOptions = '<option value="">&mdash;</option>' +
      TSEB.singersCache.map(function(s) {
        return '<option value="' + s.id + '">' + TSEB.util.esc(s.first_name) + '</option>';
      }).join('');

    var today = TSEB.util.todayStr();

    var html =
      '<form id="add-gig-form" onsubmit="event.preventDefault(); TSEB.schedule.submitAdd(this);" style="display:flex; flex-direction:column; height:100%;">' +
      '<div class="form-topbar">' +
        '<button type="button" class="topbar-link" onclick="TSEB.closeForm()">Cancel</button>' +
        '<button type="submit" class="topbar-link topbar-link-accent">Save</button>' +
      '</div>' +
      '<div class="form-body" style="overflow-y:auto; flex:1;">' +
        '<div class="eyebrow">Scheduling a gig</div>' +
        '<h1 class="form-title">New singing session</h1>' +

        '<label class="eyebrow form-eyebrow-label">Venue</label>' +
        '<select name="institution_id" class="form-input form-select form-input-italic" required>' + instOptions + '</select>' +

        '<label class="eyebrow form-eyebrow-label">Date</label>' +
        '<input type="date" name="gig_date" class="form-input form-input-italic" value="' + today + '" required>' +

        '<label class="eyebrow form-eyebrow-label">Time</label>' +
        '<input type="time" name="gig_time" class="form-input form-input-italic">' +

        '<label class="eyebrow form-eyebrow-label">Recurrence</label>' +
        '<select name="recurrence" class="form-input form-select form-input-italic">' +
          '<option value="one_time">One-time</option>' +
          '<option value="weekly">Weekly</option>' +
          '<option value="biweekly">Biweekly</option>' +
          '<option value="2x_month">2x per month</option>' +
          '<option value="monthly">Monthly</option>' +
        '</select>' +

        '<label class="eyebrow form-eyebrow-label">Singer 1 (anchor)</label>' +
        '<select name="singer1" class="form-input form-select form-input-italic">' + singerOptions + '</select>' +

        '<label class="eyebrow form-eyebrow-label">Singer 2</label>' +
        '<select name="singer2" class="form-input form-select form-input-italic">' + singerOptions + '</select>' +

        '<label class="eyebrow form-eyebrow-label">Singer 3</label>' +
        '<select name="singer3" class="form-input form-select form-input-italic">' + singerOptions + '</select>' +

        '<label class="eyebrow form-eyebrow-label">Notes</label>' +
        '<textarea name="gig_notes" class="form-input form-input-italic" rows="3" placeholder="Anything special&hellip;"></textarea>' +
      '</div>' +
      '</form>';

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

    var singerIds = [fd.get('singer1'), fd.get('singer2'), fd.get('singer3')].filter(Boolean);
    if (singerIds.length && gig) {
      await TSEB.sb.from('gig_singers').insert(
        singerIds.map(function(sid, i) {
          return { gig_id: gig.id, singer_id: sid, is_anchor: i === 0 };
        })
      );
    }

    TSEB.closeForm();
    TSEB.toast('Singing session scheduled', 'success');
    this._loaded = false;
    this.load();
  },

  async showGigDetail(gigId) {
    TSEB.showDetail('<div class="detail-topbar"><span class="topbar-link">&larr; Schedule</span></div><div class="detail-body"><div class="detail-eyebrow">Loading&hellip;</div></div>');

    var { data: gig, error } = await TSEB.sb.from('gigs')
      .select('*, institution:institutions(id, name, address, zip_code, institution_type, contacts(first_name, last_name, job_title, phone, email, is_primary)), gig_singers(singer_id, is_anchor)')
      .eq('id', gigId).single();

    if (error || !gig) {
      TSEB.closeDetail();
      TSEB.toast('Could not load gig', 'error');
      return;
    }

    var inst = gig.institution || {};
    var dt = new Date(gig.gig_date + 'T00:00:00');
    var dateLabel = dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    var timeStr = gig.gig_time ? TSEB.util.fmtTime(gig.gig_time) : '';
    var rec = TSEB.util.recurrenceLabel(gig.recurrence) || '';
    var monthShort = dt.toLocaleDateString('en-US', { month: 'short' });
    var day = dt.getDate();
    var dow = dt.toLocaleDateString('en-US', { weekday: 'long' });

    var contacts = ((inst.contacts || []).slice().sort(function(a, b) {
      return (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0);
    }));

    var singerNames = (gig.gig_singers || []).map(function(gs) {
      var name = TSEB.util.singerName(gs.singer_id);
      return gs.is_anchor ? name + ' (anchor)' : name;
    });

    var contactsHTML = '';
    if (contacts.length) {
      contactsHTML = '<div class="detail-section">' +
        '<div class="detail-section-head"><span class="eyebrow">Contacts</span></div>' +
        contacts.map(function(c) {
          var name = ((c.first_name || '') + ' ' + (c.last_name || '')).trim() || 'Contact';
          return '<div class="detail-contact-row">' +
            '<div class="detail-contact-name">' + TSEB.util.esc(name) +
              (c.is_primary ? ' <span class="smcaps faint" style="font-size:9px;">primary</span>' : '') +
            '</div>' +
            (c.job_title ? '<div class="detail-contact-meta">' + TSEB.util.esc(c.job_title) + '</div>' : '') +
            (c.phone ? '<a class="detail-contact-phone" href="tel:' + TSEB.util.esc(c.phone) + '">' + TSEB.util.esc(c.phone) + '</a>' : '') +
            (c.email ? '<a class="detail-contact-email" href="mailto:' + TSEB.util.esc(c.email) + '">' + TSEB.util.esc(c.email) + '</a>' : '') +
            '</div>';
        }).join('') +
        '</div>';
    }

    var meta = (timeStr ? timeStr : '') +
      (timeStr && rec ? ' &middot; ' : '') +
      (rec ? rec : '');

    var html =
      '<div class="detail-topbar">' +
        '<button type="button" class="topbar-link" onclick="TSEB.closeDetail()">&larr; Schedule</button>' +
        '<button type="button" class="topbar-link topbar-link-accent" onclick="TSEB.schedule.openEditForm(\'' + gig.id + '\')">Edit</button>' +
      '</div>' +
      '<div class="detail-body">' +
        '<div class="detail-hero">' +
          '<div class="detail-eyebrow">Singing at</div>' +
          '<h1 class="detail-title">' + TSEB.util.esc(inst.name || 'Gig') + '</h1>' +
        '</div>' +

        '<div class="sched-tl-list" style="padding:0; margin-bottom:18px;">' +
          '<div class="sched-tl-row" style="cursor:default; padding-bottom:0;">' +
            '<div class="sched-tl-date">' +
              '<div class="sched-tl-month">' + TSEB.util.esc(monthShort) + '</div>' +
              '<div class="sched-tl-day">' + day + '</div>' +
              '<div class="sched-tl-dow">' + TSEB.util.esc(dow) + '</div>' +
            '</div>' +
            '<div class="sched-tl-rule" style="margin-bottom:0;"></div>' +
            '<div class="sched-tl-body">' +
              '<div class="sched-tl-venue">' + TSEB.util.esc(dateLabel) + '</div>' +
              (meta ? '<div class="sched-tl-meta">' + meta + '</div>' : '') +
              (inst.address ? '<div class="sched-tl-singers" style="font-size:13px;">' + TSEB.util.esc(inst.address) + (inst.zip_code ? ' &middot; ' + TSEB.util.esc(inst.zip_code) : '') + '</div>' : '') +
            '</div>' +
          '</div>' +
        '</div>' +

        (singerNames.length
          ? '<div class="detail-section"><div class="detail-section-head"><span class="eyebrow">Singers</span></div>' +
            '<div class="sched-tl-singers" style="padding:0 4px;">' + TSEB.util.esc(singerNames.join(' · ')) + '</div></div>'
          : '<div class="detail-section"><div class="detail-section-head"><span class="eyebrow">Singers</span></div><div class="detail-empty">No singers assigned yet</div></div>') +

        contactsHTML +

        (gig.notes
          ? '<div class="detail-section"><div class="detail-section-head"><span class="eyebrow">Notes</span></div>' +
            '<div class="detail-notes">' + TSEB.util.esc(gig.notes) + '</div></div>'
          : '') +

        (inst.id
          ? '<div style="margin-top:24px;"><button class="btn btn-accent" style="width:100%;" onclick="TSEB.outreach.showDetail(\'' + inst.id + '\')">Open facility</button></div>'
          : '') +
      '</div>';

    TSEB.showDetail(html);
  },

  async openEditForm(gigId) {
    var { data: gig } = await TSEB.sb.from('gigs').select('*').eq('id', gigId).single();
    if (!gig) { TSEB.toast('Could not load gig', 'error'); return; }

    TSEB.closeDetail();

    var singerOptions = '<option value="">&mdash;</option>' +
      TSEB.singersCache.map(function(s) {
        return '<option value="' + s.id + '">' + TSEB.util.esc(s.first_name) + '</option>';
      }).join('');

    var { data: currentSingers } = await TSEB.sb.from('gig_singers')
      .select('singer_id, is_anchor')
      .eq('gig_id', gigId)
      .order('is_anchor', { ascending: false });
    var cs = currentSingers || [];

    var rec = gig.recurrence || 'one_time';

    var html =
      '<form onsubmit="event.preventDefault(); TSEB.schedule.submitEdit(this, \'' + gigId + '\');" style="display:flex; flex-direction:column; height:100%;">' +
      '<div class="form-topbar">' +
        '<button type="button" class="topbar-link" onclick="TSEB.closeForm(); TSEB.schedule.showGigDetail(\'' + gigId + '\')">Cancel</button>' +
        '<button type="submit" class="topbar-link topbar-link-accent">Save</button>' +
      '</div>' +
      '<div class="form-body" style="overflow-y:auto; flex:1;">' +
        '<div class="eyebrow">Editing gig</div>' +
        '<h1 class="form-title">Edit singing session</h1>' +

        '<label class="eyebrow form-eyebrow-label">Date</label>' +
        '<input type="date" name="gig_date" class="form-input form-input-italic" required value="' + (gig.gig_date || '') + '">' +

        '<label class="eyebrow form-eyebrow-label">Time</label>' +
        '<input type="time" name="gig_time" class="form-input form-input-italic" value="' + (gig.gig_time ? gig.gig_time.slice(0, 5) : '') + '">' +

        '<label class="eyebrow form-eyebrow-label">Recurrence</label>' +
        '<select name="recurrence" class="form-input form-select form-input-italic">' +
          '<option value="one_time"' + (rec === 'one_time' ? ' selected' : '') + '>One-time</option>' +
          '<option value="weekly"' + (rec === 'weekly' ? ' selected' : '') + '>Weekly</option>' +
          '<option value="biweekly"' + (rec === 'biweekly' ? ' selected' : '') + '>Biweekly</option>' +
          '<option value="2x_month"' + (rec === '2x_month' ? ' selected' : '') + '>2x per month</option>' +
          '<option value="monthly"' + (rec === 'monthly' ? ' selected' : '') + '>Monthly</option>' +
        '</select>' +

        '<label class="eyebrow form-eyebrow-label">Singer 1 (anchor)</label>' +
        '<select name="singer1" class="form-input form-select form-input-italic">' + singerOptions + '</select>' +

        '<label class="eyebrow form-eyebrow-label">Singer 2</label>' +
        '<select name="singer2" class="form-input form-select form-input-italic">' + singerOptions + '</select>' +

        '<label class="eyebrow form-eyebrow-label">Singer 3</label>' +
        '<select name="singer3" class="form-input form-select form-input-italic">' + singerOptions + '</select>' +

        '<label class="eyebrow form-eyebrow-label">Notes</label>' +
        '<textarea name="gig_notes" class="form-input form-input-italic" rows="3">' + TSEB.util.esc(gig.notes || '') + '</textarea>' +
      '</div>' +
      '</form>';

    TSEB.showForm(html);

    setTimeout(function() {
      var form = document.getElementById('form-container');
      if (!form) return;
      var selects = form.querySelectorAll('select[name^="singer"]');
      cs.forEach(function(s, i) {
        if (selects[i]) selects[i].value = s.singer_id;
      });
    }, 50);
  },

  async submitEdit(form, gigId) {
    var fd = new FormData(form);

    var { error } = await TSEB.sb.from('gigs').update({
      gig_date: fd.get('gig_date'),
      gig_time: fd.get('gig_time') || null,
      recurrence: fd.get('recurrence'),
      notes: fd.get('gig_notes') || null
    }).eq('id', gigId);

    if (error) { TSEB.toast('Error: ' + error.message, 'error'); return; }

    await TSEB.sb.from('gig_singers').delete().eq('gig_id', gigId);
    var singerIds = [fd.get('singer1'), fd.get('singer2'), fd.get('singer3')].filter(Boolean);
    if (singerIds.length) {
      await TSEB.sb.from('gig_singers').insert(
        singerIds.map(function(sid, i) {
          return { gig_id: gigId, singer_id: sid, is_anchor: i === 0 };
        })
      );
    }

    TSEB.closeForm();
    TSEB.toast('Gig updated', 'success');
    this._loaded = false;
    this.load();
  }
};
