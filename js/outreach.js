// TSEB Outreach module — facility pipeline, the coordinator's primary screen
TSEB.outreach = {
  _loaded: false,
  _data: null,       // full dataset from last fetch
  _filter: 'all',   // 'all' | 'mine'
  _statusFilter: null, // null = all, or a status string like 'active'

  async load() {
    this._loaded = true;
    TSEB.showSkeleton('outreach-list', 4);

    const { data, error } = await TSEB.sb.from('institutions')
      .select('*, outreacher:singers!institutions_outreacher_id_fkey(first_name), contacts(first_name, last_name, phone, is_primary)')
      .order('next_step_due', { ascending: true, nullsFirst: false });

    if (error) {
      document.getElementById('outreach-list').innerHTML =
        '<div class="empty-state"><div class="empty-state-title">Couldn\'t load facilities</div>' +
        '<div class="empty-state-body">' + TSEB.util.esc(error.message) + '</div></div>';
      return;
    }

    this._data = data || [];
    this._renderFilter();
    this._renderAll();
  },

  _renderFilter() {
    const el = document.getElementById('outreach-filter');
    if (!el) return;
    el.innerHTML =
      '<button class="filter-toggle-btn' + (this._filter === 'all' ? ' active' : '') + '" onclick="TSEB.outreach.setFilter(\'all\')">All</button>' +
      '<button class="filter-toggle-btn' + (this._filter === 'mine' ? ' active' : '') + '" onclick="TSEB.outreach.setFilter(\'mine\')">Mine</button>';
  },

  setFilter(val) {
    this._filter = val;
    this._renderFilter();
    this._renderAll();
  },

  _filtered() {
    if (!this._data) return [];
    var data = this._data;
    if (this._filter === 'mine' && TSEB.currentSinger) {
      data = data.filter(function(i) {
        return i.outreacher_id === TSEB.currentSinger.id;
      });
    }
    if (this._statusFilter) {
      var sf = this._statusFilter;
      data = data.filter(function(i) { return i.status === sf; });
    }
    return data;
  },

  setStatusFilter: function(status) {
    if (status === null || status === 'null') {
      this._statusFilter = null;
    } else {
      this._statusFilter = (this._statusFilter === status) ? null : status;
    }
    this._renderPills();
    this._renderCards();
    this._renderCallout();
  },

  _renderAll() {
    this._renderCallout();
    this._renderPills();
    this._renderCards();
  },

  _renderCallout() {
    const el = document.getElementById('outreach-callout');
    if (!el) return;
    const data = this._filtered();
    const overdue = data.filter(function(i) {
      return TSEB.util.isOverdue(i.next_step_due) && !['active', 'inactive', 'previous', 'on_hold'].includes(i.status);
    });
    const soon = data.filter(function(i) {
      return TSEB.util.isSoon(i.next_step_due) && !['active', 'inactive', 'previous', 'on_hold'].includes(i.status);
    });

    if (overdue.length === 0 && soon.length === 0) {
      el.style.display = 'none';
      return;
    }

    el.style.display = '';
    const parts = [];
    if (overdue.length > 0) {
      parts.push('<strong style="color:var(--error);">' + overdue.length + ' overdue</strong>');
    }
    if (soon.length > 0) {
      parts.push('<strong style="color:var(--warning);">' + soon.length + ' due this week</strong>');
    }
    el.innerHTML = 'Follow-up needed: ' + parts.join(' · ');
  },

  _renderPills() {
    const el = document.getElementById('outreach-pills');
    if (!el) return;
    const data = this._data || [];

    const statusGroups = {
      initial_contact: 0,
      in_conversation: 0,
      site_visit: 0,
      active: 0,
      on_hold: 0,
      previous: 0,
      inactive: 0
    };
    data.forEach(function(i) {
      if (i.status in statusGroups) statusGroups[i.status]++;
    });

    const labels = {
      initial_contact: 'Initial',
      in_conversation: 'Talking',
      site_visit: 'Site Visit',
      active: 'Active',
      on_hold: 'Hold',
      previous: 'Previous',
      inactive: 'Inactive'
    };
    const badgeClass = {
      initial_contact: 'badge-initial',
      in_conversation: 'badge-conversation',
      site_visit: 'badge-conversation',
      active: 'badge-active',
      on_hold: 'badge-muted',
      previous: 'badge-muted',
      inactive: 'badge-overdue'
    };

    var self = this;
    el.innerHTML = Object.keys(statusGroups).map(function(key) {
      var count = statusGroups[key];
      if (count === 0) return '';
      var isActive = self._statusFilter === key;
      var activeStyle = isActive ? 'outline:3px solid var(--primary); outline-offset:1px; font-weight:700;' : '';
      return '<span class="badge ' + (badgeClass[key] || 'badge-muted') + '" ' +
        'style="cursor:pointer; ' + activeStyle + '" ' +
        'onclick="TSEB.outreach.setStatusFilter(\'' + key + '\')">' +
        labels[key] + ' · ' + count + '</span>';
    }).join('') +
    (self._statusFilter ? ' <span style="font-size:13px; color:var(--primary); cursor:pointer; text-decoration:underline;" onclick="TSEB.outreach.setStatusFilter(null)">Clear filter</span>' : '');
  },

  _renderCards() {
    const el = document.getElementById('outreach-list');
    if (!el) return;
    const data = this._filtered();

    if (data.length === 0) {
      el.innerHTML = '<div class="empty-state">' +
        '<div class="empty-state-title">No facilities yet</div>' +
        '<div class="empty-state-body">Tap the + button to add the first care facility to your outreach list.</div>' +
        '</div>';
      return;
    }

    // Sort: overdue first, then by next_step_due, then no-date items last
    const sorted = data.slice().sort(function(a, b) {
      const aOverdue = TSEB.util.isOverdue(a.next_step_due);
      const bOverdue = TSEB.util.isOverdue(b.next_step_due);
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      if (!a.next_step_due && b.next_step_due) return 1;
      if (a.next_step_due && !b.next_step_due) return -1;
      if (a.next_step_due && b.next_step_due) {
        return new Date(a.next_step_due) - new Date(b.next_step_due);
      }
      return (a.name || '').localeCompare(b.name || '');
    });

    el.innerHTML = sorted.map(function(i) {
      return TSEB.outreach._cardHTML(i);
    }).join('');
  },

  _cardHTML(i) {
    const overdue = TSEB.util.isOverdue(i.next_step_due);
    const soon = TSEB.util.isSoon(i.next_step_due);
    const cardClass = 'card' + (overdue ? ' card-overdue' : '');

    let nextStepHTML = '';
    if (i.next_step) {
      const dateText = overdue ? 'Overdue' : (soon ? 'Due ' + TSEB.util.fmtDateShort(i.next_step_due) : TSEB.util.fmtDateShort(i.next_step_due));
      const dateStyle = overdue ? 'color:var(--error); font-weight:700;' : (soon ? 'color:var(--warning); font-weight:600;' : 'color:var(--muted);');
      nextStepHTML = '<div class="card-next-step">' +
        '<span style="' + dateStyle + ' font-size:13px;">' + TSEB.util.esc(dateText) + '</span>' +
        ' — ' + TSEB.util.esc(i.next_step) +
        '</div>';
    }

    const outreacherHTML = i.outreacher
      ? '<span style="margin-right:8px;">' + TSEB.util.singerChip(i.outreacher.first_name) + '</span>'
      : '';

    // Primary contact
    var primary = (i.contacts || []).find(function(c) { return c.is_primary; }) || (i.contacts || [])[0];
    var contactLine = '';
    if (primary) {
      var cName = ((primary.first_name || '') + ' ' + (primary.last_name || '')).trim();
      contactLine = '<div class="card-detail">' + TSEB.util.esc(cName) +
        (primary.phone ? ' · <a href="tel:' + TSEB.util.esc(primary.phone) + '" style="color:var(--primary);" onclick="event.stopPropagation();">' + TSEB.util.esc(primary.phone) + '</a>' : '') +
        '</div>';
    }

    return '<div class="' + cardClass + '" style="cursor:pointer;" onclick="TSEB.outreach.showDetail(\'' + i.id + '\')">' +
      '<div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:6px;">' +
      '<div class="card-title">' + TSEB.util.esc(i.name) + '</div>' +
      TSEB.util.statusBadge(i.status) +
      '</div>' +
      (i.address || i.zip_code ? '<div class="card-detail">' + TSEB.util.esc(i.address || '') + (i.address && i.zip_code ? ' · ' : '') + (i.zip_code ? TSEB.util.esc(i.zip_code) : '') + '</div>' : '') +
      contactLine +
      nextStepHTML +
      (outreacherHTML ? '<div style="margin-top:8px;">' + outreacherHTML + '</div>' : '') +
      '</div>';
  },

  async showDetail(id) {
    TSEB.showDetail('<div class="modal-header"><div class="modal-title">Loading...</div></div>');

    const [{ data: inst }, { data: contacts }, { data: activities }] = await Promise.all([
      TSEB.sb.from('institutions')
        .select('*, outreacher:singers!institutions_outreacher_id_fkey(first_name)')
        .eq('id', id).single(),
      TSEB.sb.from('contacts')
        .select('*').eq('institution_id', id).order('is_primary', { ascending: false }),
      TSEB.sb.from('activities')
        .select('*, singer:singers(first_name)').eq('institution_id', id).order('activity_date', { ascending: false })
    ]);

    if (!inst) {
      TSEB.closeDetail();
      TSEB.toast('Could not load facility details', 'error');
      return;
    }

    const overdue = TSEB.util.isOverdue(inst.next_step_due);
    const daysOverdue = overdue
      ? Math.floor((new Date() - new Date(inst.next_step_due)) / 86400000)
      : 0;

    // Next step banner
    let nextStepBanner = '';
    if (inst.next_step) {
      nextStepBanner = '<div style="background:' + (overdue ? 'var(--error-light)' : 'var(--accent-light)') + '; border-left:4px solid ' + (overdue ? 'var(--error)' : 'var(--accent)') + '; padding:14px 16px; border-radius:0 var(--radius-sm) var(--radius-sm) 0; margin-bottom:16px;">' +
        '<div style="font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:' + (overdue ? 'var(--error)' : 'var(--warning)') + '; margin-bottom:4px;">Next Step</div>' +
        '<div style="font-size:17px;">' + TSEB.util.esc(inst.next_step) + '</div>' +
        '<div style="font-size:14px; color:var(--muted); margin-top:6px;">Due: ' + TSEB.util.fmtDate(inst.next_step_due) +
        (overdue ? ' <strong style="color:var(--error);">· ' + daysOverdue + ' days overdue</strong>' : '') +
        '</div></div>';
    }

    // Status change buttons
    const allStatuses = [
      { value: 'initial_contact', label: 'Initial Contact' },
      { value: 'in_conversation', label: 'In Conversation' },
      { value: 'site_visit', label: 'Site Visit' },
      { value: 'active', label: 'Active' },
      { value: 'on_hold', label: 'On Hold' },
      { value: 'previous', label: 'Previous' },
      { value: 'inactive', label: 'Inactive' }
    ];
    const statusButtons = allStatuses.map(function(s) {
      const isCurrent = s.value === inst.status;
      return '<button class="btn ' + (isCurrent ? 'btn-primary' : 'btn-secondary') + '" style="font-size:14px; min-height:40px; padding:8px 14px;' + (isCurrent ? ' cursor:default;' : '') + '" ' +
        (isCurrent ? 'disabled' : 'onclick="TSEB.outreach.changeStatus(\'' + id + '\', \'' + s.value + '\')"') +
        '>' + TSEB.util.esc(s.label) + '</button>';
    }).join('');

    // Contacts section
    let contactsHTML = '<div style="margin-bottom:20px;">' +
      '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">' +
      '<h4 style="font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); margin:0;">Contacts</h4>' +
      '<button class="btn btn-secondary" style="font-size:13px; min-height:36px; padding:6px 12px;" onclick="TSEB.outreach.openAddContact(\'' + id + '\')">+ Add Contact</button>' +
      '</div>';
    if (contacts && contacts.length) {
      contactsHTML += contacts.map(function(c) {
          return '<div style="background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-sm); padding:12px; margin-bottom:8px;">' +
            '<div style="display:flex; justify-content:space-between; align-items:flex-start;">' +
            '<div><div style="font-weight:600; font-size:16px;">' + TSEB.util.esc((c.first_name || '') + ' ' + (c.last_name || '')).trim() +
            (c.is_primary ? ' <span style="font-size:11px; color:var(--accent); font-weight:700;">PRIMARY</span>' : '') + '</div>' +
            (c.job_title ? '<div style="font-size:14px; color:var(--muted);">' + TSEB.util.esc(c.job_title) + '</div>' : '') +
            '<div style="font-size:14px; margin-top:4px;">' +
            (c.phone ? '<a href="tel:' + TSEB.util.esc(c.phone) + '" style="color:var(--primary);">' + TSEB.util.esc(c.phone) + '</a>' : '') +
            (c.phone && c.email ? ' · ' : '') +
            (c.email ? '<a href="mailto:' + TSEB.util.esc(c.email) + '" style="color:var(--primary);">' + TSEB.util.esc(c.email) + '</a>' : '') +
            '</div></div>' +
            '<button class="btn btn-ghost" style="font-size:12px; min-height:32px; padding:4px 10px; align-self:flex-start;" onclick="event.stopPropagation(); TSEB.outreach.openEditContact(\'' + c.id + '\', \'' + id + '\')">Edit</button>' +
            '</div></div>';
        }).join('');
    } else {
      contactsHTML += '<p style="color:var(--muted); font-size:15px;">No contacts yet. Add one to track who to call.</p>';
    }
    contactsHTML += '</div>';

    // Timeline section
    let timelineHTML = '';
    if (activities && activities.length) {
      timelineHTML = activities.map(function(a) {
        const isAction = ['phone_call','voicemail','email_sent','email_received','in_person','site_visit','first_sing'].includes(a.activity_type);
        const isStatus = a.activity_type === 'status_change';
        const dotColor = isStatus ? 'var(--info)' : isAction ? 'var(--primary)' : 'var(--muted)';
        const typeLabel = (a.activity_type || '').replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
        return '<div style="display:flex; gap:12px; margin-bottom:16px;">' +
          '<div style="flex-shrink:0; width:10px; height:10px; border-radius:50%; background:' + dotColor + '; margin-top:6px;"></div>' +
          '<div style="flex:1;">' +
          '<div style="font-size:13px; color:var(--muted); margin-bottom:2px;">' +
          TSEB.util.fmtDate(a.activity_date) +
          (a.singer ? ' · ' + TSEB.util.esc(a.singer.first_name) : '') +
          ' · <em>' + TSEB.util.esc(typeLabel) + '</em>' +
          '</div>' +
          '<div style="font-size:15px;">' + TSEB.util.esc(a.description) + '</div>' +
          '</div></div>';
      }).join('');
    } else {
      timelineHTML = '<p style="color:var(--muted); font-size:15px;">No activity logged yet. Tap Log Activity to get started.</p>';
    }

    const typeLabel = inst.institution_type
      ? inst.institution_type.replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); })
      : '';

    const html =
      '<div class="modal-header">' +
      '<button class="modal-back-btn" onclick="TSEB.closeDetail()" aria-label="Close">&#8592;</button>' +
      '<div class="modal-title">' + TSEB.util.esc(inst.name) + '</div>' +
      '</div>' +
      '<div class="modal-body">' +
      '<div style="margin-bottom:16px;">' +
      (typeLabel ? '<div style="font-size:15px; color:var(--muted);">' + TSEB.util.esc(typeLabel) + '</div>' : '') +
      (inst.address || inst.zip_code ? '<div style="font-size:15px; color:var(--muted);">' + TSEB.util.esc(inst.address || '') + (inst.address && inst.zip_code ? ' · ' : '') + (inst.zip_code ? TSEB.util.esc(inst.zip_code) : '') + '</div>' : '') +
      '<div style="margin-top:8px;">' + TSEB.util.statusBadge(inst.status) + '</div>' +
      '</div>' +

      nextStepBanner +

      '<div style="display:flex; gap:10px; margin-bottom:20px;">' +
      '<button class="btn btn-primary" style="flex:1;" onclick="TSEB.outreach.openLogActivity(\'' + id + '\')">Log Activity</button>' +
      '<button class="btn btn-secondary" onclick="TSEB.outreach.openEditForm(\'' + id + '\')">Edit</button>' +
      '</div>' +

      (inst.outreacher
        ? '<div style="margin-bottom:16px;"><span style="font-size:14px; color:var(--muted); margin-right:8px;">Outreacher:</span>' + TSEB.util.singerChip(inst.outreacher.first_name) + '</div>'
        : '') +

      contactsHTML +

      '<div style="margin-bottom:20px;">' +
      '<h4 style="font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); margin-bottom:10px;">Change Status</h4>' +
      '<div style="display:flex; flex-wrap:wrap; gap:8px;">' + statusButtons + '</div>' +
      '</div>' +

      '<div style="margin-bottom:20px;">' +
      '<h4 style="font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); margin-bottom:10px;">Timeline</h4>' +
      timelineHTML +
      '</div>' +

      (inst.notes
        ? '<div style="margin-bottom:20px;"><h4 style="font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); margin-bottom:10px;">Notes</h4><p style="font-size:15px;">' + TSEB.util.esc(inst.notes) + '</p></div>'
        : '') +

      '</div>';

    TSEB.showDetail(html);
  },

  openAddForm() {
    const today = TSEB.util.todayStr();
    const singerOptions = TSEB.singersCache.map(function(s) {
      return '<option value="' + s.id + '">' + TSEB.util.esc(s.first_name) + '</option>';
    }).join('');

    const html =
      '<div class="modal-header">' +
      '<button class="modal-back-btn" onclick="TSEB.closeForm()" aria-label="Cancel">&#8592;</button>' +
      '<div class="modal-title">Add Facility</div>' +
      '</div>' +
      '<div class="modal-body">' +
      '<form id="add-institution-form" onsubmit="event.preventDefault(); TSEB.outreach.submitAdd(this);">' +

      '<div class="form-group">' +
      '<label class="form-label" for="add-inst-name">Facility Name *</label>' +
      '<input id="add-inst-name" name="name" type="text" class="form-input" placeholder="e.g. Sunrise Care Center" required>' +
      '</div>' +

      '<div class="form-group">' +
      '<label class="form-label" for="add-inst-type">Facility Type</label>' +
      '<select id="add-inst-type" name="institution_type" class="form-select">' +
      '<option value="">Select type...</option>' +
      '<option value="hospital">Hospital</option>' +
      '<option value="hospice">Hospice</option>' +
      '<option value="nursing_snf">Nursing / SNF</option>' +
      '<option value="memory_care">Memory Care</option>' +
      '<option value="senior_center">Senior Center</option>' +
      '<option value="nicu">NICU</option>' +
      '<option value="retirement">Retirement</option>' +
      '<option value="other">Other</option>' +
      '</select>' +
      '</div>' +

      '<div class="form-group">' +
      '<label class="form-label" for="add-inst-status">Status *</label>' +
      '<select id="add-inst-status" name="status" class="form-select" required>' +
      '<option value="initial_contact">Initial Contact</option>' +
      '<option value="in_conversation">In Conversation</option>' +
      '<option value="site_visit">Site Visit</option>' +
      '<option value="active">Active</option>' +
      '<option value="on_hold">On Hold</option>' +
      '</select>' +
      '</div>' +

      '<div class="form-group">' +
      '<label class="form-label" for="add-inst-address">Address</label>' +
      '<input id="add-inst-address" name="address" type="text" class="form-input" placeholder="Street address or city">' +
      '</div>' +

      '<div class="form-group">' +
      '<label class="form-label">Zip Code</label>' +
      '<input name="zip_code" type="text" class="form-input" placeholder="e.g. 94611" maxlength="10">' +
      '</div>' +

      '<div class="form-group">' +
      '<label class="form-label" for="add-inst-outreacher">Outreacher</label>' +
      '<select id="add-inst-outreacher" name="outreacher_id" class="form-select">' +
      '<option value="">Unassigned</option>' +
      singerOptions +
      '</select>' +
      '</div>' +

      '<div class="form-group">' +
      '<label class="form-label" for="add-inst-next-step">Next Step</label>' +
      '<input id="add-inst-next-step" name="next_step" type="text" class="form-input" placeholder="e.g. Call music director">' +
      '</div>' +

      '<div class="form-group">' +
      '<label class="form-label" for="add-inst-next-due">Next Step Due</label>' +
      '<input id="add-inst-next-due" name="next_step_due" type="date" class="form-input" value="' + today + '">' +
      '</div>' +

      '<details style="margin-bottom:16px;">' +
      '<summary style="font-size:16px; font-weight:600; cursor:pointer; padding:8px 0; color:var(--primary);">+ Add primary contact (optional)</summary>' +
      '<div style="margin-top:12px;">' +
      '<div class="form-group">' +
      '<label class="form-label" for="add-contact-fname">First Name</label>' +
      '<input id="add-contact-fname" name="contact_first_name" type="text" class="form-input">' +
      '</div>' +
      '<div class="form-group">' +
      '<label class="form-label" for="add-contact-lname">Last Name</label>' +
      '<input id="add-contact-lname" name="contact_last_name" type="text" class="form-input">' +
      '</div>' +
      '<div class="form-group">' +
      '<label class="form-label" for="add-contact-title">Title</label>' +
      '<input id="add-contact-title" name="contact_title" type="text" class="form-input" placeholder="e.g. Music Therapist">' +
      '</div>' +
      '<div class="form-group">' +
      '<label class="form-label" for="add-contact-phone">Phone</label>' +
      '<input id="add-contact-phone" name="contact_phone" type="tel" class="form-input">' +
      '</div>' +
      '<div class="form-group">' +
      '<label class="form-label" for="add-contact-email">Email</label>' +
      '<input id="add-contact-email" name="contact_email" type="email" class="form-input">' +
      '</div>' +
      '</div></details>' +

      '<button type="submit" class="btn btn-primary" style="width:100%;">Add Facility</button>' +
      '</form>' +
      '</div>';

    TSEB.showForm(html);
  },

  async submitAdd(form) {
    const fd = new FormData(form);
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const { data: inst, error } = await TSEB.sb.from('institutions').insert({
      name: fd.get('name'),
      institution_type: fd.get('institution_type') || null,
      status: fd.get('status'),
      address: fd.get('address') || null,
      zip_code: fd.get('zip_code') || null,
      outreacher_id: fd.get('outreacher_id') || null,
      next_step: fd.get('next_step') || null,
      next_step_due: fd.get('next_step_due') || null
    }).select().single();

    if (error) {
      TSEB.toast('Error: ' + error.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Add Facility';
      return;
    }

    // Add contact if provided
    const cName = fd.get('contact_first_name');
    if (cName && inst) {
      await TSEB.sb.from('contacts').insert({
        institution_id: inst.id,
        first_name: cName,
        last_name: fd.get('contact_last_name') || null,
        job_title: fd.get('contact_title') || null,
        phone: fd.get('contact_phone') || null,
        email: fd.get('contact_email') || null,
        is_primary: true
      });
    }

    TSEB.closeForm();
    TSEB.toast('Facility added', 'success');
    this._loaded = false;
    await this.load();
  },

  async openEditForm(id) {
    const { data: inst } = await TSEB.sb.from('institutions').select('*').eq('id', id).single();
    if (!inst) return;

    const singerOptions = TSEB.singersCache.map(function(s) {
      return '<option value="' + s.id + '" ' + (inst.outreacher_id === s.id ? 'selected' : '') + '>' + TSEB.util.esc(s.first_name) + '</option>';
    }).join('');

    const statusOptions = [
      { value: 'initial_contact', label: 'Initial Contact' },
      { value: 'in_conversation', label: 'In Conversation' },
      { value: 'site_visit', label: 'Site Visit' },
      { value: 'active', label: 'Active' },
      { value: 'on_hold', label: 'On Hold' },
      { value: 'previous', label: 'Previous' },
      { value: 'inactive', label: 'Inactive' }
    ].map(function(s) {
      return '<option value="' + s.value + '" ' + (inst.status === s.value ? 'selected' : '') + '>' + s.label + '</option>';
    }).join('');

    const typeOptions = [
      { value: '', label: 'Select type...' },
      { value: 'hospital', label: 'Hospital' },
      { value: 'hospice', label: 'Hospice' },
      { value: 'nursing_snf', label: 'Nursing / SNF' },
      { value: 'memory_care', label: 'Memory Care' },
      { value: 'senior_center', label: 'Senior Center' },
      { value: 'nicu', label: 'NICU' },
      { value: 'retirement', label: 'Retirement' },
      { value: 'other', label: 'Other' }
    ].map(function(t) {
      return '<option value="' + t.value + '" ' + (inst.institution_type === t.value ? 'selected' : '') + '>' + t.label + '</option>';
    }).join('');

    const recurrenceOptions = [
      { value: '', label: 'None' },
      { value: 'weekly', label: 'Weekly' },
      { value: 'biweekly', label: 'Biweekly' },
      { value: '2x_month', label: '2x per month' },
      { value: 'monthly', label: 'Monthly' },
      { value: 'one_time', label: 'One-time' }
    ].map(function(r) {
      return '<option value="' + r.value + '" ' + (inst.recurrence === r.value ? 'selected' : '') + '>' + r.label + '</option>';
    }).join('');

    const html =
      '<div class="modal-header">' +
      '<button class="modal-back-btn" onclick="TSEB.closeForm()" aria-label="Cancel">&#8592;</button>' +
      '<div class="modal-title">Edit Facility</div>' +
      '</div>' +
      '<div class="modal-body">' +
      '<form id="edit-institution-form" onsubmit="event.preventDefault(); TSEB.outreach.submitEdit(this);">' +
      '<input type="hidden" name="id" value="' + inst.id + '">' +

      '<div class="form-group">' +
      '<label class="form-label">Facility Name *</label>' +
      '<input name="name" type="text" class="form-input" value="' + TSEB.util.esc(inst.name || '') + '" required>' +
      '</div>' +

      '<div class="form-group">' +
      '<label class="form-label">Facility Type</label>' +
      '<select name="institution_type" class="form-select">' + typeOptions + '</select>' +
      '</div>' +

      '<div class="form-group">' +
      '<label class="form-label">Status *</label>' +
      '<select name="status" class="form-select" required>' + statusOptions + '</select>' +
      '</div>' +

      '<div class="form-group">' +
      '<label class="form-label">Address</label>' +
      '<input name="address" type="text" class="form-input" value="' + TSEB.util.esc(inst.address || '') + '">' +
      '</div>' +

      '<div class="form-group">' +
      '<label class="form-label">Zip Code</label>' +
      '<input name="zip_code" type="text" class="form-input" value="' + TSEB.util.esc(inst.zip_code || '') + '" placeholder="e.g. 94611" maxlength="10">' +
      '</div>' +

      '<div class="form-group">' +
      '<label class="form-label">Outreacher</label>' +
      '<select name="outreacher_id" class="form-select">' +
      '<option value="">Unassigned</option>' + singerOptions +
      '</select>' +
      '</div>' +

      '<div class="form-group">' +
      '<label class="form-label">Recurrence (active venues)</label>' +
      '<select name="recurrence" class="form-select">' + recurrenceOptions + '</select>' +
      '</div>' +

      '<div class="form-group">' +
      '<label class="form-label">Next Step</label>' +
      '<input name="next_step" type="text" class="form-input" value="' + TSEB.util.esc(inst.next_step || '') + '">' +
      '</div>' +

      '<div class="form-group">' +
      '<label class="form-label">Next Step Due</label>' +
      '<input name="next_step_due" type="date" class="form-input" value="' + (inst.next_step_due || '') + '">' +
      '</div>' +

      '<div class="form-group">' +
      '<label class="form-label">Notes</label>' +
      '<textarea name="notes" class="form-input">' + TSEB.util.esc(inst.notes || '') + '</textarea>' +
      '</div>' +

      '<button type="submit" class="btn btn-primary" style="width:100%; margin-bottom:12px;">Save Changes</button>' +
      '</form>' +
      '</div>';

    TSEB.closeDetail();
    TSEB.showForm(html);
  },

  async submitEdit(form) {
    const fd = new FormData(form);
    const id = fd.get('id');
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const { error } = await TSEB.sb.from('institutions').update({
      name: fd.get('name'),
      institution_type: fd.get('institution_type') || null,
      status: fd.get('status'),
      address: fd.get('address') || null,
      zip_code: fd.get('zip_code') || null,
      outreacher_id: fd.get('outreacher_id') || null,
      recurrence: fd.get('recurrence') || null,
      next_step: fd.get('next_step') || null,
      next_step_due: fd.get('next_step_due') || null,
      notes: fd.get('notes') || null
    }).eq('id', id);

    if (error) {
      TSEB.toast('Error: ' + error.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Save Changes';
      return;
    }

    TSEB.closeForm();
    TSEB.toast('Facility updated', 'success');
    this._loaded = false;
    await this.load();
    // Reopen detail
    this.showDetail(id);
  },

  openLogActivity(institutionId) {
    const today = TSEB.util.todayStr();
    const singerOptions = TSEB.singersCache.map(function(s) {
      return '<option value="' + s.id + '">' + TSEB.util.esc(s.first_name) + '</option>';
    }).join('');

    // Find facility name for the form title
    const inst = this._data ? this._data.find(function(i) { return i.id === institutionId; }) : null;
    const instName = inst ? inst.name : 'Facility';

    const html =
      '<div class="modal-header">' +
      '<button class="modal-back-btn" onclick="TSEB.closeForm(); TSEB.outreach.showDetail(\'' + institutionId + '\')" aria-label="Back">&#8592;</button>' +
      '<div class="modal-title">Log Activity</div>' +
      '</div>' +
      '<div class="modal-body">' +
      '<div style="font-size:15px; color:var(--muted); margin-bottom:20px;">For: <strong style="color:var(--text);">' + TSEB.util.esc(instName) + '</strong></div>' +
      '<form id="log-activity-form" onsubmit="event.preventDefault(); TSEB.outreach.submitLogActivity(this);">' +
      '<input type="hidden" name="institution_id" value="' + institutionId + '">' +

      '<div class="form-group">' +
      '<label class="form-label" for="log-singer">Who did this?</label>' +
      '<select id="log-singer" name="singer_id" class="form-select">' +
      '<option value="">Select singer...</option>' + singerOptions +
      '</select>' +
      '</div>' +

      '<div class="form-group">' +
      '<label class="form-label" for="log-type">Activity Type *</label>' +
      '<select id="log-type" name="activity_type" class="form-select" required>' +
      '<option value="">Select type...</option>' +
      '<option value="phone_call">Phone Call</option>' +
      '<option value="voicemail">Voicemail</option>' +
      '<option value="email_sent">Email Sent</option>' +
      '<option value="email_received">Email Received</option>' +
      '<option value="in_person">In Person</option>' +
      '<option value="site_visit">Site Visit</option>' +
      '<option value="first_sing">First Sing</option>' +
      '<option value="status_change">Status Change</option>' +
      '<option value="note">Note</option>' +
      '</select>' +
      '</div>' +

      '<div class="form-group">' +
      '<label class="form-label" for="log-date">Date *</label>' +
      '<input id="log-date" name="activity_date" type="date" class="form-input" value="' + today + '" required>' +
      '</div>' +

      '<div class="form-group">' +
      '<label class="form-label" for="log-contact">Who did you speak with?</label>' +
      '<input id="log-contact" name="contact_person" type="text" class="form-input" placeholder="Name at the facility">' +
      '</div>' +

      '<div class="form-group">' +
      '<label class="form-label" for="log-desc">What happened? *</label>' +
      '<textarea id="log-desc" name="description" class="form-input" rows="4" placeholder="Describe the interaction..." required></textarea>' +
      '</div>' +

      '<details style="margin-bottom:16px;">' +
      '<summary style="font-size:16px; font-weight:600; cursor:pointer; padding:8px 0; color:var(--primary);">Update next step (optional)</summary>' +
      '<div style="margin-top:12px;">' +
      '<div class="form-group">' +
      '<label class="form-label" for="log-next-step">Next Step</label>' +
      '<input id="log-next-step" name="next_step" type="text" class="form-input" placeholder="What happens next?">' +
      '</div>' +
      '<div class="form-group">' +
      '<label class="form-label" for="log-next-due">Due Date</label>' +
      '<input id="log-next-due" name="next_step_due" type="date" class="form-input">' +
      '</div>' +
      '</div></details>' +

      '<button type="submit" class="btn btn-primary" style="width:100%;">Save Activity</button>' +
      '</form>' +
      '</div>';

    TSEB.closeDetail();
    TSEB.showForm(html);
  },

  async submitLogActivity(form) {
    const fd = new FormData(form);
    const institutionId = fd.get('institution_id');
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const { error: actErr } = await TSEB.sb.from('activities').insert({
      institution_id: institutionId,
      singer_id: fd.get('singer_id') || null,
      activity_type: fd.get('activity_type'),
      activity_date: fd.get('activity_date'),
      contact_person: fd.get('contact_person') || null,
      description: fd.get('description')
    });

    if (actErr) {
      TSEB.toast('Error: ' + actErr.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Save Activity';
      return;
    }

    // Update next step if provided
    const nextStep = fd.get('next_step');
    const nextDue = fd.get('next_step_due');
    if (nextStep || nextDue) {
      const updates = {};
      if (nextStep) updates.next_step = nextStep;
      if (nextDue) updates.next_step_due = nextDue;
      await TSEB.sb.from('institutions').update(updates).eq('id', institutionId);
    }

    TSEB.closeForm();
    TSEB.toast('Activity logged', 'success');
    this._loaded = false;
    await this.load();
    // Reopen detail
    this.showDetail(institutionId);
  },

  async changeStatus(id, newStatus) {
    const { error } = await TSEB.sb.from('institutions').update({ status: newStatus }).eq('id', id);
    if (error) {
      TSEB.toast('Error: ' + error.message, 'error');
      return;
    }

    // Log automatic status change activity
    const label = newStatus.replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
    await TSEB.sb.from('activities').insert({
      institution_id: id,
      activity_type: 'status_change',
      activity_date: TSEB.util.todayStr(),
      description: 'Status changed to: ' + label
    });

    TSEB.toast('Status updated to ' + label, 'success');
    this._loaded = false;
    await this.load();
    this.showDetail(id);
  },

  // ============================================================
  // CONTACTS — Add / Edit
  // ============================================================
  openAddContact: function(institutionId) {
    TSEB.showForm(
      '<div class="modal-header">' +
      '<button class="modal-back-btn" onclick="TSEB.closeForm(); TSEB.outreach.showDetail(\'' + institutionId + '\')" aria-label="Back">&#8592;</button>' +
      '<div class="modal-title">Add Contact</div></div>' +
      '<div class="modal-body">' +
      '<form onsubmit="event.preventDefault(); TSEB.outreach.submitAddContact(this, \'' + institutionId + '\');">' +
      '<div class="form-group"><label class="form-label">First Name</label>' +
      '<input type="text" name="first_name" class="form-input" required placeholder="First name"></div>' +
      '<div class="form-group"><label class="form-label">Last Name</label>' +
      '<input type="text" name="last_name" class="form-input" placeholder="Last name"></div>' +
      '<div class="form-group"><label class="form-label">Job Title</label>' +
      '<input type="text" name="job_title" class="form-input" placeholder="e.g. Activities Director"></div>' +
      '<div class="form-group"><label class="form-label">Phone</label>' +
      '<input type="tel" name="phone" class="form-input" placeholder="(510) 555-1234"></div>' +
      '<div class="form-group"><label class="form-label">Email</label>' +
      '<input type="email" name="email" class="form-input" placeholder="name@facility.com"></div>' +
      '<div class="form-group" style="display:flex; align-items:center; gap:12px;">' +
      '<input type="checkbox" name="is_primary" id="contact-primary" style="width:24px; height:24px;">' +
      '<label for="contact-primary" class="form-label" style="margin:0;">Primary contact</label></div>' +
      '<button type="submit" class="btn btn-primary" style="width:100%; margin-top:8px;">Add Contact</button>' +
      '</form></div>'
    );
  },

  async submitAddContact(form, institutionId) {
    var fd = new FormData(form);
    if (!fd.get('first_name')) { TSEB.toast('Please enter a name', 'warning'); return; }
    var { error } = await TSEB.sb.from('contacts').insert({
      institution_id: institutionId,
      first_name: fd.get('first_name'),
      last_name: fd.get('last_name') || null,
      job_title: fd.get('job_title') || null,
      phone: fd.get('phone') || null,
      email: fd.get('email') || null,
      is_primary: form.querySelector('[name="is_primary"]').checked
    });
    if (error) { TSEB.toast('Error: ' + error.message, 'error'); return; }
    TSEB.closeForm();
    TSEB.toast('Contact added!', 'success');
    this._loaded = false;
    await this.load();
    this.showDetail(institutionId);
  },

  async openEditContact(contactId, institutionId) {
    var { data: c } = await TSEB.sb.from('contacts').select('*').eq('id', contactId).single();
    if (!c) { TSEB.toast('Could not load contact', 'error'); return; }

    TSEB.showForm(
      '<div class="modal-header">' +
      '<button class="modal-back-btn" onclick="TSEB.closeForm(); TSEB.outreach.showDetail(\'' + institutionId + '\')" aria-label="Back">&#8592;</button>' +
      '<div class="modal-title">Edit Contact</div></div>' +
      '<div class="modal-body">' +
      '<form onsubmit="event.preventDefault(); TSEB.outreach.submitEditContact(this, \'' + contactId + '\', \'' + institutionId + '\');">' +
      '<div class="form-group"><label class="form-label">First Name</label>' +
      '<input type="text" name="first_name" class="form-input" required value="' + TSEB.util.esc(c.first_name || '') + '"></div>' +
      '<div class="form-group"><label class="form-label">Last Name</label>' +
      '<input type="text" name="last_name" class="form-input" value="' + TSEB.util.esc(c.last_name || '') + '"></div>' +
      '<div class="form-group"><label class="form-label">Job Title</label>' +
      '<input type="text" name="job_title" class="form-input" value="' + TSEB.util.esc(c.job_title || '') + '"></div>' +
      '<div class="form-group"><label class="form-label">Phone</label>' +
      '<input type="tel" name="phone" class="form-input" value="' + TSEB.util.esc(c.phone || '') + '"></div>' +
      '<div class="form-group"><label class="form-label">Email</label>' +
      '<input type="email" name="email" class="form-input" value="' + TSEB.util.esc(c.email || '') + '"></div>' +
      '<div class="form-group" style="display:flex; align-items:center; gap:12px;">' +
      '<input type="checkbox" name="is_primary" id="contact-primary-edit" style="width:24px; height:24px;"' + (c.is_primary ? ' checked' : '') + '>' +
      '<label for="contact-primary-edit" class="form-label" style="margin:0;">Primary contact</label></div>' +
      '<button type="submit" class="btn btn-primary" style="width:100%; margin-top:8px;">Save Changes</button>' +
      '</form></div>'
    );
  },

  async submitEditContact(form, contactId, institutionId) {
    var fd = new FormData(form);
    var { error } = await TSEB.sb.from('contacts').update({
      first_name: fd.get('first_name'),
      last_name: fd.get('last_name') || null,
      job_title: fd.get('job_title') || null,
      phone: fd.get('phone') || null,
      email: fd.get('email') || null,
      is_primary: form.querySelector('[name="is_primary"]').checked
    }).eq('id', contactId);
    if (error) { TSEB.toast('Error: ' + error.message, 'error'); return; }
    TSEB.closeForm();
    TSEB.toast('Contact updated!', 'success');
    this._loaded = false;
    await this.load();
    this.showDetail(institutionId);
  }
};
