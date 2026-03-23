// TSEB Singers module — roster, add/edit singer, availability
TSEB.singers = {
  _loaded: false,

  async load() {
    this._loaded = true;
    TSEB.showSkeleton('singers-list', 4);
    var { data } = await TSEB.sb.from('singers').select('*').order('first_name');
    TSEB.singersCache = data || [];
    this._render();
  },

  _render: function() {
    var singers = TSEB.singersCache;
    var headerEl = document.getElementById('singers-header');
    var el = document.getElementById('singers-list');

    var available = singers.filter(function(s) { return s.availability === 'available'; });
    if (headerEl) {
      headerEl.innerHTML = '<div style="font-family:var(--font-display); font-size:20px; font-weight:600;">' +
        available.length + ' singer' + (available.length !== 1 ? 's' : '') + ' available</div>';
    }
    if (!el) return;

    if (!singers.length) {
      el.innerHTML = '<div class="empty-state"><div class="empty-state-title">No volunteers added yet</div>' +
        '<div class="empty-state-body">Tap + to add singers to your roster.</div></div>';
      return;
    }

    var groups = { available: [], limited: [], unavailable: [] };
    singers.forEach(function(s) { (groups[s.availability] || groups.available).push(s); });

    var order = [
      { key: 'available', label: 'Available', badge: 'badge-active' },
      { key: 'limited', label: 'Limited', badge: 'badge-conversation' },
      { key: 'unavailable', label: 'Unavailable', badge: 'badge-muted' }
    ];

    el.innerHTML = order.map(function(g) {
      if (!groups[g.key].length) return '';
      return '<h3 style="font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); margin:20px 0 10px;">' +
        g.label + ' (' + groups[g.key].length + ')</h3>' +
        groups[g.key].map(function(s) {
          var role = s.role === 'both' ? '<span class="badge badge-active">Singer</span> <span class="badge badge-conversation">Outreacher</span>'
            : s.role === 'outreacher' ? '<span class="badge badge-conversation">Outreacher</span>'
            : '<span class="badge badge-active">Singer</span>';
          return '<div class="card" style="cursor:pointer; margin-bottom:10px;" onclick="TSEB.singers.showDetail(\'' + s.id + '\')">' +
            '<div style="display:flex; justify-content:space-between; align-items:center;">' +
            '<div class="card-title" style="font-size:18px;">' + TSEB.util.esc(s.first_name) + '</div>' +
            '<div>' + role + '</div></div>' +
            (s.preferred_days ? '<div class="card-detail" style="margin-top:4px;">Prefers: ' + TSEB.util.esc(s.preferred_days) + '</div>' : '') +
            (s.notes ? '<div class="card-detail" style="margin-top:4px; font-style:italic;">' + TSEB.util.esc(s.notes) + '</div>' : '') +
            '</div>';
        }).join('');
    }).join('');
  },

  showDetail: function(singerId) {
    var s = TSEB.singersCache.find(function(x) { return x.id === singerId; });
    if (!s) return;
    var self = this;

    var roleLabel = s.role === 'both' ? 'Singer & Outreacher' : s.role === 'outreacher' ? 'Outreacher' : 'Singer';

    TSEB.showDetail(
      '<div class="modal-header">' +
      '<button class="modal-back-btn" onclick="TSEB.closeDetail()" aria-label="Close">&#8592;</button>' +
      '<div class="modal-title">' + TSEB.util.esc(s.first_name) + '</div></div>' +
      '<div class="modal-body">' +
      '<div style="font-size:16px; color:var(--muted); margin-bottom:8px;">Role: ' + roleLabel + '</div>' +
      (s.preferred_days ? '<div style="font-size:16px; color:var(--muted); margin-bottom:8px;">Preferred days: ' + TSEB.util.esc(s.preferred_days) + '</div>' : '') +
      (s.notes ? '<div style="font-size:16px; color:var(--muted); margin-bottom:16px;">' + TSEB.util.esc(s.notes) + '</div>' : '') +

      '<h4 style="font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); margin:16px 0 12px;">Availability</h4>' +
      '<div style="display:flex; flex-direction:column; gap:10px;">' +
      self._availBtn(singerId, 'available', s.availability, 'Available', 'Ready to sing') +
      self._availBtn(singerId, 'limited', s.availability, 'Limited', 'Can sing sometimes') +
      self._availBtn(singerId, 'unavailable', s.availability, 'Unavailable', 'Not available right now') +
      '</div>' +

      '<button class="btn btn-secondary" style="width:100%; margin-top:24px;" onclick="TSEB.singers.openEditForm(\'' + singerId + '\')">Edit Details</button>' +
      '</div>'
    );
  },

  _availBtn: function(id, value, current, label, desc) {
    var active = current === value;
    var cls = active ? 'btn btn-primary' : 'btn btn-ghost';
    return '<button class="' + cls + '" style="text-align:left; width:100%;" onclick="TSEB.singers.updateAvailability(\'' + id + '\',\'' + value + '\')">' +
      '<div style="font-weight:600;">' + label + (active ? ' ✓' : '') + '</div>' +
      '<div style="font-size:14px; opacity:.7;">' + desc + '</div></button>';
  },

  async updateAvailability(singerId, val) {
    var { error } = await TSEB.sb.from('singers').update({ availability: val }).eq('id', singerId);
    if (error) { TSEB.toast('Error: ' + error.message, 'error'); return; }
    TSEB.toast('Availability updated!', 'success');
    var { data } = await TSEB.sb.from('singers').select('*').order('first_name');
    TSEB.singersCache = data || [];
    this._render();
    this.showDetail(singerId);
  },

  openAddForm: function() {
    TSEB.showForm(
      '<div class="modal-header">' +
      '<button class="modal-back-btn" onclick="TSEB.closeForm()" aria-label="Cancel">&#8592;</button>' +
      '<div class="modal-title">Add Singer</div></div>' +
      '<div class="modal-body">' +
      '<form onsubmit="event.preventDefault(); TSEB.singers.submitAdd(this);">' +
      '<div class="form-group"><label class="form-label">First Name</label>' +
      '<input type="text" name="first_name" class="form-input" required placeholder="First name only"></div>' +
      '<div class="form-group"><label class="form-label">Role</label>' +
      '<select name="role" class="form-input form-select"><option value="singer">Singer</option><option value="outreacher">Outreacher</option><option value="both">Both</option></select></div>' +
      '<div class="form-group"><label class="form-label">Availability</label>' +
      '<select name="availability" class="form-input form-select"><option value="available">Available</option><option value="limited">Limited</option><option value="unavailable">Unavailable</option></select></div>' +
      '<div class="form-group"><label class="form-label">Preferred Days</label>' +
      '<input type="text" name="preferred_days" class="form-input" placeholder="e.g. Tue, Thu"></div>' +
      '<div class="form-group"><label class="form-label">Notes</label>' +
      '<textarea name="notes" class="form-input" rows="3" placeholder="Any notes..."></textarea></div>' +
      '<button type="submit" class="btn btn-primary" style="width:100%; margin-top:8px;">Add Singer</button>' +
      '</form></div>'
    );
  },

  async submitAdd(form) {
    var fd = new FormData(form);
    if (!fd.get('first_name')) { TSEB.toast('Please enter a name', 'warning'); return; }
    var { error } = await TSEB.sb.from('singers').insert({
      first_name: fd.get('first_name'), role: fd.get('role'), availability: fd.get('availability'),
      preferred_days: fd.get('preferred_days') || null, notes: fd.get('notes') || null
    });
    if (error) { TSEB.toast('Error: ' + error.message, 'error'); return; }
    TSEB.closeForm();
    TSEB.toast('Singer added to the roster!', 'success');
    this.load();
  },

  openEditForm: function(singerId) {
    var s = TSEB.singersCache.find(function(x) { return x.id === singerId; });
    if (!s) return;
    TSEB.closeDetail();
    TSEB.showForm(
      '<div class="modal-header">' +
      '<button class="modal-back-btn" onclick="TSEB.closeForm()" aria-label="Cancel">&#8592;</button>' +
      '<div class="modal-title">Edit ' + TSEB.util.esc(s.first_name) + '</div></div>' +
      '<div class="modal-body">' +
      '<form onsubmit="event.preventDefault(); TSEB.singers.submitEdit(this, \'' + singerId + '\');">' +
      '<div class="form-group"><label class="form-label">First Name</label>' +
      '<input type="text" name="first_name" class="form-input" required value="' + TSEB.util.esc(s.first_name) + '"></div>' +
      '<div class="form-group"><label class="form-label">Role</label>' +
      '<select name="role" class="form-input form-select">' +
      '<option value="singer"' + (s.role === 'singer' ? ' selected' : '') + '>Singer</option>' +
      '<option value="outreacher"' + (s.role === 'outreacher' ? ' selected' : '') + '>Outreacher</option>' +
      '<option value="both"' + (s.role === 'both' ? ' selected' : '') + '>Both</option></select></div>' +
      '<div class="form-group"><label class="form-label">Preferred Days</label>' +
      '<input type="text" name="preferred_days" class="form-input" value="' + TSEB.util.esc(s.preferred_days || '') + '" placeholder="e.g. Tue, Thu"></div>' +
      '<div class="form-group"><label class="form-label">Notes</label>' +
      '<textarea name="notes" class="form-input" rows="3">' + TSEB.util.esc(s.notes || '') + '</textarea></div>' +
      '<button type="submit" class="btn btn-primary" style="width:100%; margin-top:8px;">Save Changes</button>' +
      '</form></div>'
    );
  },

  async submitEdit(form, singerId) {
    var fd = new FormData(form);
    var { error } = await TSEB.sb.from('singers').update({
      first_name: fd.get('first_name'), role: fd.get('role'),
      preferred_days: fd.get('preferred_days') || null, notes: fd.get('notes') || null
    }).eq('id', singerId);
    if (error) { TSEB.toast('Error: ' + error.message, 'error'); return; }
    TSEB.closeForm();
    TSEB.toast('Singer updated!', 'success');
    this.load();
  }
};
