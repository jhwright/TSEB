// TSEB Singers module — Plainchant: filterable + groupable roster, detail with
// availability + limitation form, manuscript add/edit forms.
TSEB.singers = {
  _loaded: false,
  _filter: 'all',     // all | available | limited
  _group: 'status',   // status | role
  _gigs: null,        // upcoming gigs cache for singer detail

  _readPref: function(key, fallback) {
    try { return localStorage.getItem(key) || fallback; }
    catch (e) { return fallback; }
  },

  _writePref: function(key, val) {
    try { localStorage.setItem(key, val); } catch (e) {}
  },

  setFilter: function(v) {
    this._filter = v;
    this._writePref('tseb-singers-filter', v);
    this._render();
  },

  setGroup: function(v) {
    this._group = v;
    this._writePref('tseb-singers-group', v);
    this._render();
  },

  async load() {
    this._loaded = true;
    this._filter = this._readPref('tseb-singers-filter', 'all');
    this._group = this._readPref('tseb-singers-group', 'status');
    TSEB.showSkeleton('singers-list', 4);
    var { data } = await TSEB.sb.from('singers').select('*').order('first_name');
    TSEB.singersCache = data || [];
    this._render();
  },

  _initials: function(name) {
    if (!name) return '—';
    return name.split(/\s+/).filter(Boolean).map(function(p) { return p[0].toUpperCase(); }).join('').slice(0, 2);
  },

  _availLabel: function(a) {
    return a === 'available' ? 'Available' : a === 'limited' ? 'Limited' : a === 'unavailable' ? 'Unavailable' : (a || '—');
  },

  _roleLabel: function(r) {
    return r === 'singer' ? 'Singer' : r === 'outreacher' ? 'Outreacher' : r === 'both' ? 'Singer & Outreacher' : (r || '—');
  },

  _render: function() {
    var headerEl = document.getElementById('singers-header');
    var el = document.getElementById('singers-list');
    if (!el) return;

    var all = TSEB.singersCache;
    var counts = {
      all: all.length,
      available: all.filter(function(s) { return s.availability === 'available'; }).length,
      limited: all.filter(function(s) { return s.availability === 'limited'; }).length,
      unavailable: all.filter(function(s) { return s.availability === 'unavailable'; }).length
    };

    // Hero
    if (headerEl) {
      var label = this._filter === 'all' ? 'in the roster'
                : this._filter === 'available' ? 'ready to sing'
                : this._filter === 'limited' ? 'currently limited'
                : '';
      var n = this._filter === 'all' ? counts.all
            : counts[this._filter] || 0;
      headerEl.innerHTML =
        '<div class="singers-hero">' +
          '<div class="eyebrow">Singers</div>' +
          '<div class="singers-hero-counts">' +
            '<span class="singers-hero-num">' + n + '</span>' +
            '<span class="singers-hero-label">' + TSEB.util.esc(label) + '</span>' +
          '</div>' +
        '</div>';
    }

    if (!all.length) {
      el.innerHTML = '<div class="empty-state">' +
        '<div class="empty-state-title">No volunteers added yet</div>' +
        '<div class="empty-state-body">Tap + to add singers to your roster.</div>' +
        '</div>';
      return;
    }

    // Filter
    var filtered = all;
    if (this._filter !== 'all') {
      filtered = all.filter(function(s) { return s.availability === TSEB.singers._filter; });
    }

    // Group
    var buckets = this._buckets(filtered);

    // Controls
    var filter = this._filter, group = this._group;
    var filterOpts = [
      { id: 'all', label: 'All', n: counts.all },
      { id: 'available', label: 'Ready', n: counts.available },
      { id: 'limited', label: 'Limited', n: counts.limited }
    ];
    var groupOpts = [
      { id: 'status', label: 'Status' },
      { id: 'role', label: 'Role' }
    ];

    var html = '<div class="singers-controls">' +
      '<div class="singers-control-row">' +
        '<span class="singers-control-label">Filter</span>' +
        '<div class="singers-control-grid">' +
          filterOpts.map(function(o) {
            var cls = 'singers-control-btn' + (filter === o.id ? ' is-active' : '');
            return '<button class="' + cls + '" onclick="TSEB.singers.setFilter(\'' + o.id + '\')">' +
              '<span>' + TSEB.util.esc(o.label) + '</span>' +
              '<span class="singers-control-btn-count">' + o.n + '</span>' +
              '</button>';
          }).join('') +
        '</div>' +
      '</div>' +
      '<div class="singers-control-row">' +
        '<span class="singers-control-label">Group</span>' +
        '<div class="singers-control-grid">' +
          groupOpts.map(function(o) {
            var cls = 'singers-control-btn' + (group === o.id ? ' is-active' : '');
            return '<button class="' + cls + '" onclick="TSEB.singers.setGroup(\'' + o.id + '\')">' +
              TSEB.util.esc(o.label) +
              '</button>';
          }).join('') +
        '</div>' +
      '</div>' +
      '</div>';

    if (!buckets.length) {
      html += '<div class="empty-state"><div class="empty-state-title">No singers match</div>' +
        '<div class="empty-state-body">Try a different filter.</div></div>';
    } else {
      html += buckets.map(function(b) {
        return '<div>' +
          '<div class="singers-bucket-head">' +
            '<span class="singers-bucket-label">' + TSEB.util.esc(b.label) + '</span>' +
            '<span class="singers-bucket-count">' + b.items.length + '</span>' +
          '</div>' +
          b.items.map(function(s) { return TSEB.singers._rowHTML(s); }).join('') +
          '</div>';
      }).join('');
    }

    el.innerHTML = html;
  },

  _buckets: function(list) {
    if (this._group === 'role') {
      var rolesOrder = [
        { key: 'singer', label: 'Singers' },
        { key: 'outreacher', label: 'Outreachers' },
        { key: 'both', label: 'Singer & Outreacher' }
      ];
      return rolesOrder.map(function(r) {
        return { key: r.key, label: r.label, items: list.filter(function(s) { return s.role === r.key; }) };
      }).filter(function(b) { return b.items.length; });
    }
    // status (default)
    var statusOrder = [
      { key: 'available', label: 'Available' },
      { key: 'limited', label: 'Limited' },
      { key: 'unavailable', label: 'Unavailable' }
    ];
    return statusOrder.map(function(st) {
      return { key: st.key, label: st.label, items: list.filter(function(s) { return s.availability === st.key; }) };
    }).filter(function(b) { return b.items.length; });
  },

  _rowHTML: function(s) {
    var initials = this._initials(s.first_name);
    var dotCls = s.availability === 'available' ? 'is-available'
               : s.availability === 'limited' ? 'is-limited'
               : 'is-unavailable';
    var meta = s.role === 'both' ? 'Singer · Outreacher'
             : s.role === 'outreacher' ? 'Outreacher'
             : 'Singer';
    var sub = (s.preferred_days || '') + (s.preferred_days && s.zip_code ? ' · ' : '') + (s.zip_code || '');
    if (!sub) sub = this._availLabel(s.availability);

    return '<div class="singers-row" onclick="TSEB.singers.showDetail(\'' + s.id + '\')">' +
      '<div class="singer-avatar">' + TSEB.util.esc(initials) + '</div>' +
      '<div class="singers-row-body">' +
        '<div class="singers-row-top">' +
          '<span class="singers-row-name">' + TSEB.util.esc(s.first_name) + '</span>' +
          '<span class="singers-row-meta">' + TSEB.util.esc(meta) + '</span>' +
        '</div>' +
        '<div class="singers-row-sub">' +
          '<span class="singers-row-dot ' + dotCls + '"></span>' +
          '<span class="singers-row-detail">' + TSEB.util.esc(sub) + '</span>' +
        '</div>' +
      '</div>' +
      '</div>';
  },

  // ============================================================
  // SINGER DETAIL
  // ============================================================
  async showDetail(singerId) {
    var s = TSEB.singersCache.find(function(x) { return x.id === singerId; });
    if (!s) return;

    TSEB.showDetail(this._detailHTML(s));

    // Fetch upcoming gigs for this singer (separately, non-blocking)
    var { data: gs } = await TSEB.sb.from('gig_singers')
      .select('gig:gigs(id, gig_date, gig_time, institution:institutions(name))')
      .eq('singer_id', singerId);

    var today = TSEB.util.todayStr();
    var upcoming = (gs || [])
      .map(function(g) { return g.gig; })
      .filter(function(g) { return g && g.gig_date >= today; })
      .sort(function(a, b) { return a.gig_date.localeCompare(b.gig_date); })
      .slice(0, 5);

    var slot = document.getElementById('singer-upcoming-slot');
    if (slot) {
      if (upcoming.length) {
        slot.innerHTML = upcoming.map(function(g) {
          var dt = new Date(g.gig_date + 'T00:00:00');
          var monthShort = dt.toLocaleDateString('en-US', { month: 'short' });
          var day = dt.getDate();
          var venue = g.institution ? g.institution.name : '—';
          var timeStr = g.gig_time ? TSEB.util.fmtTime(g.gig_time) : '';
          return '<div style="display:flex; gap:12px; padding:10px 0; border-bottom:1px dotted var(--rule); align-items:baseline; cursor:pointer;" onclick="TSEB.schedule.showGigDetail(\'' + g.id + '\')">' +
            '<div style="width:36px; text-align:center; flex-shrink:0;">' +
              '<div class="smcaps faint" style="font-size:9px;">' + TSEB.util.esc(monthShort) + '</div>' +
              '<div style="font-family:var(--font-display); font-style:italic; font-size:22px; color:var(--accent-deep); line-height:1;">' + day + '</div>' +
            '</div>' +
            '<div style="flex:1; min-width:0;">' +
              '<div style="font-family:var(--font-display); font-size:16px;">' + TSEB.util.esc(venue) + '</div>' +
              (timeStr ? '<div class="smcaps faint" style="margin-top:2px;">' + timeStr + '</div>' : '') +
            '</div>' +
            '</div>';
        }).join('');
      } else {
        slot.innerHTML = '<div class="detail-empty">None on the books yet.</div>';
      }
    }
  },

  _detailHTML: function(s) {
    var initials = this._initials(s.first_name);
    var role = this._roleLabel(s.role);
    var avail = s.availability || 'available';
    var meta = role + (s.zip_code ? ' &middot; ' + TSEB.util.esc(s.zip_code) : '');

    var availOpts = [
      { id: 'available', label: 'Available' },
      { id: 'limited', label: 'Limited' },
      { id: 'unavailable', label: 'Unavailable' }
    ];
    var availButtons = availOpts.map(function(o) {
      var cls = 'singer-avail-btn' + (avail === o.id ? ' is-active' : '');
      return '<button type="button" class="' + cls + '" onclick="TSEB.singers.updateAvailability(\'' + s.id + '\',\'' + o.id + '\')">' +
        TSEB.util.esc(o.label) + '</button>';
    }).join('');

    var limitBlock = '';
    if (avail === 'limited') {
      limitBlock = this._limitBlockHTML(s);
    }

    return '<div class="detail-topbar">' +
        '<button type="button" class="topbar-link" onclick="TSEB.closeDetail()">&larr; Singers</button>' +
        '<button type="button" class="topbar-link topbar-link-accent" onclick="TSEB.singers.openEditForm(\'' + s.id + '\')">Edit</button>' +
      '</div>' +
      '<div class="detail-body">' +
        '<div class="singer-detail-hero">' +
          '<div class="singer-avatar singer-avatar-lg">' + TSEB.util.esc(initials) + '</div>' +
          '<div class="eyebrow">' + meta + '</div>' +
          '<h1 class="singer-detail-name">' + TSEB.util.esc(s.first_name) + '</h1>' +
          (s.preferred_days ? '<div class="singer-detail-days">' + TSEB.util.esc(s.preferred_days) + '</div>' : '') +
        '</div>' +

        '<hr class="h-rule"/>' +

        '<div class="detail-section">' +
          '<div class="detail-section-head"><span class="eyebrow">Availability</span></div>' +
          '<div class="singer-avail-grid">' + availButtons + '</div>' +
          limitBlock +
        '</div>' +

        '<div class="detail-section">' +
          '<div class="detail-section-head"><span class="eyebrow">Upcoming gigs</span></div>' +
          '<div id="singer-upcoming-slot" class="detail-empty">Loading&hellip;</div>' +
        '</div>' +

        (s.notes ? '<div class="detail-section">' +
          '<div class="detail-section-head"><span class="eyebrow">Notes</span></div>' +
          '<div class="detail-notes">' + TSEB.util.esc(s.notes) + '</div>' +
        '</div>' : '') +
      '</div>';
  },

  _limitBlockHTML: function(s) {
    var note = s.notes || '';
    var days = s.preferred_days || '';
    return '<div class="singer-limit-block">' +
      '<div class="singer-limit-head">' +
        '<div class="eyebrow">What\'s limiting them?</div>' +
        '<span class="smcaps faint" style="font-size:9px;">shown when scheduling</span>' +
      '</div>' +
      '<label class="eyebrow" style="display:block; margin-bottom:6px; font-size:9px;">When are they available?</label>' +
      '<input id="limit-days" class="singer-limit-input" value="' + TSEB.util.esc(days) + '" placeholder="e.g. First half of month, weekends only">' +
      '<label class="eyebrow" style="display:block; margin-bottom:6px; font-size:9px;">Note for the coordinator</label>' +
      '<textarea id="limit-note" class="singer-limit-input singer-limit-textarea" rows="3" placeholder="Anything the scheduler should know&hellip;">' + TSEB.util.esc(note) + '</textarea>' +
      '<button type="button" class="btn btn-accent" style="width:100%; margin-top:6px;" onclick="TSEB.singers.saveLimit(\'' + s.id + '\')">Save</button>' +
      '</div>';
  },

  async saveLimit(singerId) {
    var days = document.getElementById('limit-days');
    var note = document.getElementById('limit-note');
    var update = {};
    if (days) update.preferred_days = days.value || null;
    if (note) update.notes = note.value || null;
    var { error } = await TSEB.sb.from('singers').update(update).eq('id', singerId);
    if (error) { TSEB.toast('Error: ' + error.message, 'error'); return; }
    TSEB.toast('Saved', 'success');
    var { data } = await TSEB.sb.from('singers').select('*').order('first_name');
    TSEB.singersCache = data || [];
    this._render();
  },

  async updateAvailability(singerId, val) {
    var { error } = await TSEB.sb.from('singers').update({ availability: val }).eq('id', singerId);
    if (error) { TSEB.toast('Error: ' + error.message, 'error'); return; }
    var { data } = await TSEB.sb.from('singers').select('*').order('first_name');
    TSEB.singersCache = data || [];
    this._render();
    var s = TSEB.singersCache.find(function(x) { return x.id === singerId; });
    if (s) {
      // Re-render the detail in place
      document.getElementById('detail-container').innerHTML =
        this._detailHTML(s) + TSEB._feedbackLink('Detail modal');
      // Re-fetch upcoming gigs
      this.showDetail(singerId);
    }
    TSEB.toast(val === 'available' ? 'Marked available' : val === 'limited' ? 'Marked limited' : 'Marked unavailable', 'success');
  },

  // ============================================================
  // ADD / EDIT FORMS — manuscript style
  // ============================================================
  openAddForm: function() {
    var html =
      '<form onsubmit="event.preventDefault(); TSEB.singers.submitAdd(this);" style="display:flex; flex-direction:column; height:100%;">' +
      '<div class="form-topbar">' +
        '<button type="button" class="topbar-link" onclick="TSEB.closeForm()">Cancel</button>' +
        '<button type="submit" class="topbar-link topbar-link-accent">Save</button>' +
      '</div>' +
      '<div class="form-body" style="overflow-y:auto; flex:1;">' +
        '<div class="eyebrow">Welcoming a new singer</div>' +
        '<h1 class="form-title">A new voice</h1>' +

        '<label class="eyebrow form-eyebrow-label">First name</label>' +
        '<input type="text" name="first_name" class="form-input form-input-display" required placeholder="First name only" autocapitalize="words">' +

        '<label class="eyebrow form-eyebrow-label">Role</label>' +
        '<select name="role" class="form-input form-select form-input-italic">' +
          '<option value="singer">Singer</option>' +
          '<option value="outreacher">Outreacher</option>' +
          '<option value="both">Both</option>' +
        '</select>' +

        '<label class="eyebrow form-eyebrow-label">Availability</label>' +
        '<select name="availability" class="form-input form-select form-input-italic">' +
          '<option value="available">Available</option>' +
          '<option value="limited">Limited</option>' +
          '<option value="unavailable">Unavailable</option>' +
        '</select>' +

        '<label class="eyebrow form-eyebrow-label">Preferred days</label>' +
        '<input type="text" name="preferred_days" class="form-input form-input-italic" placeholder="e.g. Tue, Thu">' +

        '<label class="eyebrow form-eyebrow-label">Zip code</label>' +
        '<input type="text" name="zip_code" class="form-input form-input-italic" placeholder="e.g. 94611" maxlength="10" inputmode="numeric">' +

        '<label class="eyebrow form-eyebrow-label">Notes</label>' +
        '<textarea name="notes" class="form-input form-input-italic" rows="3" placeholder="Anything the coordinator should know&hellip;"></textarea>' +
      '</div>' +
      '</form>';

    TSEB.showForm(html);
  },

  async submitAdd(form) {
    var fd = new FormData(form);
    if (!fd.get('first_name')) { TSEB.toast('Please enter a name', 'warning'); return; }
    var { error } = await TSEB.sb.from('singers').insert({
      first_name: fd.get('first_name'),
      role: fd.get('role'),
      availability: fd.get('availability'),
      preferred_days: fd.get('preferred_days') || null,
      zip_code: fd.get('zip_code') || null,
      notes: fd.get('notes') || null
    });
    if (error) { TSEB.toast('Error: ' + error.message, 'error'); return; }
    TSEB.closeForm();
    TSEB.toast('Welcome to the circle', 'success');
    this.load();
  },

  openEditForm: function(singerId) {
    var s = TSEB.singersCache.find(function(x) { return x.id === singerId; });
    if (!s) return;
    TSEB.closeDetail();

    var rOpts = ['singer', 'outreacher', 'both'].map(function(r) {
      return '<option value="' + r + '"' + (s.role === r ? ' selected' : '') + '>' +
        (r === 'singer' ? 'Singer' : r === 'outreacher' ? 'Outreacher' : 'Both') +
        '</option>';
    }).join('');

    var aOpts = ['available', 'limited', 'unavailable'].map(function(a) {
      return '<option value="' + a + '"' + (s.availability === a ? ' selected' : '') + '>' +
        (a === 'available' ? 'Available' : a === 'limited' ? 'Limited' : 'Unavailable') +
        '</option>';
    }).join('');

    var html =
      '<form onsubmit="event.preventDefault(); TSEB.singers.submitEdit(this, \'' + singerId + '\');" style="display:flex; flex-direction:column; height:100%;">' +
      '<div class="form-topbar">' +
        '<button type="button" class="topbar-link" onclick="TSEB.closeForm(); TSEB.singers.showDetail(\'' + singerId + '\')">Cancel</button>' +
        '<button type="submit" class="topbar-link topbar-link-accent">Save</button>' +
      '</div>' +
      '<div class="form-body" style="overflow-y:auto; flex:1;">' +
        '<div class="eyebrow">Editing</div>' +
        '<h1 class="form-title">' + TSEB.util.esc(s.first_name) + '</h1>' +

        '<label class="eyebrow form-eyebrow-label">First name</label>' +
        '<input type="text" name="first_name" class="form-input form-input-display" required value="' + TSEB.util.esc(s.first_name) + '" autocapitalize="words">' +

        '<label class="eyebrow form-eyebrow-label">Role</label>' +
        '<select name="role" class="form-input form-select form-input-italic">' + rOpts + '</select>' +

        '<label class="eyebrow form-eyebrow-label">Availability</label>' +
        '<select name="availability" class="form-input form-select form-input-italic">' + aOpts + '</select>' +

        '<label class="eyebrow form-eyebrow-label">Preferred days</label>' +
        '<input type="text" name="preferred_days" class="form-input form-input-italic" value="' + TSEB.util.esc(s.preferred_days || '') + '" placeholder="e.g. Tue, Thu">' +

        '<label class="eyebrow form-eyebrow-label">Zip code</label>' +
        '<input type="text" name="zip_code" class="form-input form-input-italic" value="' + TSEB.util.esc(s.zip_code || '') + '" placeholder="e.g. 94611" maxlength="10" inputmode="numeric">' +

        '<label class="eyebrow form-eyebrow-label">Notes</label>' +
        '<textarea name="notes" class="form-input form-input-italic" rows="3">' + TSEB.util.esc(s.notes || '') + '</textarea>' +
      '</div>' +
      '</form>';

    TSEB.showForm(html);
  },

  async submitEdit(form, singerId) {
    var fd = new FormData(form);
    var { error } = await TSEB.sb.from('singers').update({
      first_name: fd.get('first_name'),
      role: fd.get('role'),
      availability: fd.get('availability'),
      preferred_days: fd.get('preferred_days') || null,
      zip_code: fd.get('zip_code') || null,
      notes: fd.get('notes') || null
    }).eq('id', singerId);
    if (error) { TSEB.toast('Error: ' + error.message, 'error'); return; }
    TSEB.closeForm();
    TSEB.toast('Saved', 'success');
    this.load();
  }
};
