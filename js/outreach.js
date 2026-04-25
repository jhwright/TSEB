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
    const data = this._filtered();
    el.innerHTML =
      '<button class="filter-toggle-btn' + (this._filter === 'all' ? ' active' : '') + '" onclick="TSEB.outreach.setFilter(\'all\')">All facilities</button>' +
      '<button class="filter-toggle-btn' + (this._filter === 'mine' ? ' active' : '') + '" onclick="TSEB.outreach.setFilter(\'mine\')">Mine</button>' +
      '<span class="filter-toggle-count">' + data.length + '</span>';
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
    this._renderFilter();
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
    const overdueCount = overdue.length;
    const soonCount = soon.length;
    el.innerHTML =
      '<span class="callout-numeral">' + overdueCount + '</span>' +
      '<div class="callout-body">' +
        '<div class="callout-headline">overdue follow-up' + (overdueCount === 1 ? '' : 's') + '</div>' +
        (soonCount > 0 ? '<div class="eyebrow callout-sub">+' + soonCount + ' due this week</div>' : '') +
      '</div>' +
      '<span class="callout-action">tend &rarr;</span>';
  },

  _renderPills() {
    const el = document.getElementById('outreach-pills');
    if (!el) return;
    const data = this._data || [];

    const order = ['initial_contact', 'in_conversation', 'site_visit', 'active', 'on_hold', 'previous', 'inactive'];
    const counts = {};
    order.forEach(function(k) { counts[k] = 0; });
    data.forEach(function(i) {
      if (i.status in counts) counts[i.status]++;
    });

    var self = this;
    el.innerHTML = order.map(function(key) {
      if (counts[key] === 0) return '';
      const isActive = self._statusFilter === key;
      const label = TSEB.util.statusLabel(key);
      return '<span class="status-pill' + (isActive ? ' is-active' : '') + '" data-status="' + key + '" ' +
        'onclick="TSEB.outreach.setStatusFilter(\'' + key + '\')">' +
        '<span class="dot"></span>' + label +
        '<span class="status-pill-count">' + counts[key] + '</span></span>';
    }).join('');
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

    // Subtitle: "{type} · {city or address head} · {zip}"
    const typeLabel = i.institution_type
      ? i.institution_type.replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); })
      : '';
    const subtitleParts = [];
    if (typeLabel) subtitleParts.push(TSEB.util.esc(typeLabel));
    if (i.address) subtitleParts.push(TSEB.util.esc(i.address));
    if (i.zip_code) subtitleParts.push(TSEB.util.esc(i.zip_code));
    const subtitleHTML = subtitleParts.length
      ? '<div class="card-subtitle">' + subtitleParts.join(' &middot; ') + '</div>'
      : '';

    // Next step block (italic body + accent left rule, warning if overdue)
    let nextStepHTML = '';
    if (i.next_step) {
      const dateText = overdue ? 'Overdue' : ('Due ' + TSEB.util.fmtDateShort(i.next_step_due));
      nextStepHTML = '<div class="card-next-step' + (overdue ? ' card-next-step-overdue' : '') + '">' +
        '<div class="card-next-step-eyebrow">Next &middot; ' + TSEB.util.esc(dateText) + '</div>' +
        '<div class="card-next-step-body">' + TSEB.util.esc(i.next_step) + '</div>' +
        '</div>';
    }

    // Primary contact (smcaps "↳ Name")
    var primary = (i.contacts || []).find(function(c) { return c.is_primary; }) || (i.contacts || [])[0];
    var contactLine = '';
    if (primary) {
      var cName = ((primary.first_name || '') + ' ' + (primary.last_name || '')).trim();
      if (cName) {
        contactLine = '<div class="card-contact">&#8627; ' + TSEB.util.esc(cName) + '</div>';
      }
    }

    return '<div class="card outreach-card" onclick="TSEB.outreach.showDetail(\'' + i.id + '\')">' +
      '<div class="card-head">' +
      '<h3 class="card-title">' + TSEB.util.esc(i.name) + '</h3>' +
      TSEB.util.statusPill(i.status, { compact: true }) +
      '</div>' +
      subtitleHTML +
      nextStepHTML +
      contactLine +
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

    const typeLabel = inst.institution_type
      ? inst.institution_type.replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); })
      : '';

    // Eyebrow line: type · address · zip
    const eyebrowParts = [];
    if (typeLabel) eyebrowParts.push(TSEB.util.esc(typeLabel));
    if (inst.address) eyebrowParts.push(TSEB.util.esc(inst.address));
    if (inst.zip_code) eyebrowParts.push(TSEB.util.esc(inst.zip_code));
    const eyebrowHTML = eyebrowParts.length
      ? '<div class="eyebrow detail-eyebrow">' + eyebrowParts.join(' &middot; ') + '</div>'
      : '';

    // Status pill row (all statuses, current is active)
    const allStatuses = ['initial_contact','in_conversation','site_visit','active','on_hold','previous','inactive'];
    const statusRow = allStatuses.map(function(s) {
      const isCurrent = s === inst.status;
      const onClick = isCurrent ? '' : ' onclick="TSEB.outreach.changeStatus(\'' + id + '\', \'' + s + '\')"';
      return TSEB.util.statusPill(s, { active: isCurrent, attrs: onClick });
    }).join(' ');

    // Next-action banner — paper-2 background, italic display body
    let nextActionHTML = '';
    if (inst.next_step) {
      const dueText = overdue
        ? 'Overdue · ' + daysOverdue + ' day' + (daysOverdue === 1 ? '' : 's')
        : 'Due ' + TSEB.util.fmtDate(inst.next_step_due);
      nextActionHTML =
        '<div class="detail-next-action">' +
        '<div class="eyebrow detail-next-eyebrow' + (overdue ? ' is-overdue' : '') + '">Next action &middot; ' + TSEB.util.esc(dueText) + '</div>' +
        '<div class="detail-next-body">' + TSEB.util.esc(inst.next_step) + '</div>' +
        '<button class="btn btn-accent detail-next-cta" onclick="TSEB.outreach.openLogActivity(\'' + id + '\')">Log activity</button>' +
        '</div>';
    } else {
      nextActionHTML =
        '<div class="detail-next-action">' +
        '<div class="eyebrow">No next step set</div>' +
        '<button class="btn btn-accent detail-next-cta" onclick="TSEB.outreach.openLogActivity(\'' + id + '\')">Log activity</button>' +
        '</div>';
    }

    // Contacts (line items, dotted divider between)
    let contactsHTML = '<div class="detail-section">' +
      '<div class="detail-section-head">' +
      '<div class="eyebrow">Contacts</div>' +
      '<button class="detail-section-action" onclick="TSEB.outreach.openAddContact(\'' + id + '\')">+ Add</button>' +
      '</div>';
    if (contacts && contacts.length) {
      contactsHTML += contacts.map(function(c, i) {
        const cName = ((c.first_name || '') + ' ' + (c.last_name || '')).trim();
        const titleHTML = c.job_title
          ? '<span class="smcaps faint">' + TSEB.util.esc(c.job_title) + (c.is_primary ? ' &middot; primary' : '') + '</span>'
          : (c.is_primary ? '<span class="smcaps faint">primary</span>' : '');
        const phoneHTML = c.phone
          ? '<a class="detail-contact-phone" href="tel:' + TSEB.util.esc(c.phone) + '" onclick="event.stopPropagation();">' + TSEB.util.esc(c.phone) + '</a>'
          : '';
        const emailHTML = c.email
          ? '<a class="detail-contact-email" href="mailto:' + TSEB.util.esc(c.email) + '" onclick="event.stopPropagation();">' + TSEB.util.esc(c.email) + '</a>'
          : '';
        return '<div class="detail-contact" onclick="TSEB.outreach.openEditContact(\'' + c.id + '\', \'' + id + '\')">' +
          '<div class="detail-contact-row">' +
          '<span class="detail-contact-name">' + TSEB.util.esc(cName) + '</span>' +
          titleHTML +
          '</div>' +
          (phoneHTML || emailHTML
            ? '<div class="detail-contact-meta">' + phoneHTML + (phoneHTML && emailHTML ? '<span class="meta-sep">·</span>' : '') + emailHTML + '</div>'
            : '') +
          '</div>';
      }).join('');
    } else {
      contactsHTML += '<div class="detail-empty">No contacts yet.</div>';
    }
    contactsHTML += '</div>';

    // Timeline
    let timelineHTML = '<div class="detail-section">' +
      '<div class="detail-section-head"><div class="eyebrow">Timeline</div></div>';
    if (activities && activities.length) {
      timelineHTML += '<div class="detail-timeline">' + activities.map(function(a) {
        const tLabel = (a.activity_type || '').replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
        const dateShort = TSEB.util.fmtDateShort(a.activity_date);
        return '<div class="detail-timeline-row">' +
          '<div class="detail-timeline-date">' +
          '<div class="smcaps faint">' + TSEB.util.esc(dateShort) + '</div>' +
          '<div class="smcaps detail-timeline-type">' + TSEB.util.esc(tLabel) + '</div>' +
          '</div>' +
          '<div class="detail-timeline-rule"><span class="dot"></span></div>' +
          '<div class="detail-timeline-note">' + TSEB.util.esc(a.description || '') +
          (a.singer ? ' <span class="smcaps faint">&middot; ' + TSEB.util.esc(a.singer.first_name) + '</span>' : '') +
          '</div>' +
          '</div>';
      }).join('') + '</div>';
    } else {
      timelineHTML += '<div class="detail-empty">No activity logged yet.</div>';
    }
    timelineHTML += '</div>';

    const notesHTML = inst.notes
      ? '<div class="detail-section">' +
          '<div class="detail-section-head"><div class="eyebrow">Notes</div></div>' +
          '<div class="detail-notes">' + TSEB.util.esc(inst.notes) + '</div>' +
        '</div>'
      : '';

    const html =
      '<div class="detail-topbar">' +
      '<button class="topbar-link" onclick="TSEB.closeDetail()" aria-label="Close">&larr; Outreach</button>' +
      '<button class="topbar-link topbar-link-accent" onclick="TSEB.outreach.openEditForm(\'' + id + '\')">Edit</button>' +
      '</div>' +
      '<div class="detail-body">' +
      '<div class="detail-hero">' +
      eyebrowHTML +
      '<h1 class="detail-title">' + TSEB.util.esc(inst.name) + '</h1>' +
      '<div class="detail-status-row">' + statusRow + '</div>' +
      '</div>' +
      '<hr class="h-rule">' +
      nextActionHTML +
      contactsHTML +
      '<hr class="h-rule">' +
      timelineHTML +
      notesHTML +
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

    // Activity type buttons (status-pill style)
    const activityTypes = [
      { value: 'phone_call', label: 'Call' },
      { value: 'email_sent', label: 'Email' },
      { value: 'in_person', label: 'Visit' },
      { value: 'site_visit', label: 'Site Visit' },
      { value: 'voicemail', label: 'Voicemail' },
      { value: 'note', label: 'Note' }
    ];
    const typeButtons = activityTypes.map(function(t) {
      return '<button type="button" class="status-pill activity-type-btn" data-value="' + t.value +
        '" onclick="TSEB.outreach._pickActivityType(this)">' +
        '<span class="dot"></span>' + t.label + '</button>';
    }).join('');

    const html =
      '<div class="form-topbar">' +
      '<button type="button" class="topbar-link" onclick="TSEB.closeForm(); TSEB.outreach.showDetail(\'' + institutionId + '\')">Cancel</button>' +
      '<button type="submit" form="log-activity-form" class="topbar-link topbar-link-accent">Save</button>' +
      '</div>' +
      '<div class="form-body">' +
      '<form id="log-activity-form" onsubmit="event.preventDefault(); TSEB.outreach.submitLogActivity(this);">' +
      '<input type="hidden" name="institution_id" value="' + institutionId + '">' +
      '<input type="hidden" name="activity_type" id="log-activity-type" required value="phone_call">' +

      '<div class="eyebrow">Logging activity at</div>' +
      '<h1 class="form-title">' + TSEB.util.esc(instName) + '</h1>' +

      '<label class="eyebrow form-eyebrow-label">Type</label>' +
      '<div class="form-pill-row">' + typeButtons + '</div>' +

      '<label class="eyebrow form-eyebrow-label">Who did this?</label>' +
      '<select name="singer_id" class="form-select form-select-bare">' +
      '<option value="">Choose singer&hellip;</option>' + singerOptions +
      '</select>' +

      '<label class="eyebrow form-eyebrow-label">Contact at the facility</label>' +
      '<input name="contact_person" type="text" class="form-input" placeholder="Name (optional)">' +

      '<label class="eyebrow form-eyebrow-label">What happened?</label>' +
      '<textarea name="description" class="form-input form-textarea" rows="3" required placeholder="A few words about the interaction&hellip;"></textarea>' +

      '<label class="eyebrow form-eyebrow-label">Date</label>' +
      '<input name="activity_date" type="date" class="form-input form-input-display" value="' + today + '" required>' +

      '<div class="form-next-step-block">' +
      '<div class="eyebrow form-next-step-eyebrow">Next step (optional)</div>' +
      '<input name="next_step" type="text" class="form-input form-input-italic" placeholder="What happens next?">' +
      '<label class="smcaps faint form-next-step-due-label">Due</label>' +
      '<input name="next_step_due" type="date" class="form-input form-input-italic">' +
      '</div>' +

      '<button type="submit" class="btn btn-accent form-submit">Save activity</button>' +
      '</form>' +
      '</div>';

    TSEB.closeDetail();
    TSEB.showForm(html);

    // Mark first activity-type pill as active by default
    setTimeout(function() {
      const first = document.querySelector('.activity-type-btn[data-value="phone_call"]');
      if (first) first.classList.add('is-active');
    }, 50);
  },

  _pickActivityType: function(btn) {
    const all = document.querySelectorAll('.activity-type-btn');
    all.forEach(function(b) { b.classList.remove('is-active'); });
    btn.classList.add('is-active');
    const hidden = document.getElementById('log-activity-type');
    if (hidden) hidden.value = btn.dataset.value;
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
