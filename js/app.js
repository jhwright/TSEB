// TSEB Bedside Singing Manager - Supabase Client
// Replaces hardcoded HTML with live data from Supabase

let sb;
let currentUser = null;
let singersCache = [];

// ============================================================
// INIT
// ============================================================
async function init() {
  if (typeof supabase === 'undefined') throw new Error('Supabase CDN failed to load');
  const { createClient } = supabase;
  sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Check existing session
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    currentUser = session.user;
    showApp();
  } else {
    showLogin();
  }

  // Listen for auth changes
  sb.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
      currentUser = session.user;
      showApp();
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      showLogin();
    }
  });
}

function showLogin() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app-content').style.display = 'none';
}

function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-content').style.display = 'block';
  loadAll();
}

async function signInWithMagicLink() {
  const email = document.getElementById('login-email').value.trim();
  if (!email) { alert('Please enter your email address'); return; }

  if (!sb) { alert('App is still loading, please try again'); return; }

  const btn = document.getElementById('login-btn');
  btn.disabled = true;
  btn.textContent = 'Sending...';

  try {
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + window.location.pathname }
    });

    if (error) {
      alert('Login failed: ' + error.message);
      btn.disabled = false;
      btn.textContent = 'Send Magic Link';
    } else {
      document.getElementById('login-form').innerHTML = `
        <div style="color:var(--ok); font-weight:600; font-size:15px; margin-bottom:8px;">Check your email</div>
        <div style="color:var(--muted); font-size:14px;">We sent a login link to <strong>${esc(email)}</strong></div>
      `;
    }
  } catch (err) {
    alert('Error: ' + err.message);
    btn.disabled = false;
    btn.textContent = 'Send Magic Link';
  }
}

async function signOut() {
  await sb.auth.signOut();
}

// ============================================================
// DATA LOADING
// ============================================================
async function loadAll() {
  await loadSingers();
  await Promise.all([
    loadDashboard(),
    loadInstitutions(),
    loadOutreach(),
    loadSingersView(),
    loadSchedule()
  ]);
  populateSingerDropdowns();
}

async function loadSingers() {
  const { data } = await sb.from('singers').select('*').order('first_name');
  singersCache = data || [];
}

function singerName(id) {
  const s = singersCache.find(s => s.id === id);
  return s ? s.first_name : '—';
}

function singerChip(name) {
  return `<span class="singer-chip">${esc(name)}</span>`;
}

function esc(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDateShort(d) {
  if (!d) return '—';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isOverdue(d) {
  if (!d) return false;
  return new Date(d) < new Date(new Date().toDateString());
}

function isSoon(d) {
  if (!d) return false;
  const dt = new Date(d);
  const now = new Date(new Date().toDateString());
  const week = new Date(now); week.setDate(week.getDate() + 7);
  return dt >= now && dt <= week;
}

function statusBadge(status) {
  const map = {
    active: 'badge-active', outreach: 'badge-outreach', in_conversation: 'badge-outreach',
    site_visit: 'badge-pending', pending: 'badge-pending', previous: 'badge-inactive',
    eliminated: 'badge-eliminated', on_hold: 'badge-inactive', initial_contact: 'badge-outreach'
  };
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return `<span class="badge ${map[status] || 'badge-inactive'}">${label}</span>`;
}

function recurrenceLabel(r) {
  const map = { weekly: 'Weekly', biweekly: 'Biweekly', '2x_month': '2x/mo', monthly: 'Monthly', one_time: 'One-time' };
  return map[r] || r || '';
}

// ============================================================
// DASHBOARD
// ============================================================
async function loadDashboard() {
  const [{ count: activeCount }, { count: outreachCount }, { count: singerCount }, { data: upcomingGigs }] = await Promise.all([
    sb.from('institutions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    sb.from('institutions').select('*', { count: 'exact', head: true }).in('status', ['outreach', 'pending']),
    sb.from('singers').select('*', { count: 'exact', head: true }),
    sb.from('gigs').select('*, institution:institutions(name), gig_singers(singer_id, is_anchor)')
      .gte('gig_date', new Date().toISOString().split('T')[0])
      .order('gig_date').order('gig_time').limit(6)
  ]);

  // Stats
  const stats = document.getElementById('dash-stats');
  if (stats) {
    stats.innerHTML = `
      <div class="stat-card"><div class="number">${activeCount || 0}</div><div class="label">Active Venues</div></div>
      <div class="stat-card"><div class="number">${outreachCount || 0}</div><div class="label">In Outreach</div></div>
      <div class="stat-card"><div class="number">${singerCount || 0}</div><div class="label">Volunteers</div></div>
      <div class="stat-card"><div class="number">${(upcomingGigs || []).length}</div><div class="label">Upcoming Gigs</div></div>
    `;
  }

  // Upcoming gigs
  const gigList = document.getElementById('dash-gigs');
  if (gigList && upcomingGigs) {
    gigList.innerHTML = upcomingGigs.map(g => {
      const dt = new Date(g.gig_date + 'T00:00:00');
      const singers = (g.gig_singers || []).map(gs => singerName(gs.singer_id)).join(', ');
      const time = g.gig_time ? g.gig_time.slice(0, 5) : '';
      return `<li>
        <div class="gig-date"><div class="month">${dt.toLocaleDateString('en-US',{month:'short'})}</div><div class="day">${dt.getDate()}</div></div>
        <div class="gig-info"><div class="gig-venue">${esc(g.institution?.name)}</div><div class="gig-singers">${esc(singers)}</div><div class="gig-time">${time}</div></div>
        ${g.recurrence ? `<span class="gig-recur">${recurrenceLabel(g.recurrence)}</span>` : ''}
      </li>`;
    }).join('');
  }

  // Follow-ups due
  const { data: followups } = await sb.from('institutions')
    .select('*, outreacher:singers!institutions_outreacher_id_fkey(first_name)')
    .not('next_step', 'is', null)
    .not('status', 'in', '("active","eliminated","previous")')
    .order('next_step_due', { ascending: true, nullsFirst: false })
    .limit(5);

  const fuList = document.getElementById('dash-followups');
  if (fuList && followups) {
    fuList.innerHTML = followups.map(i => {
      const overdue = isOverdue(i.next_step_due);
      const soon = isSoon(i.next_step_due);
      const bg = overdue ? 'background:var(--danger-light)' : soon ? 'background:var(--warn-light)' : '';
      const dateColor = overdue ? 'color:var(--danger); font-weight:600' : soon ? 'color:var(--warn); font-weight:600' : '';
      return `<div style="display:flex; align-items:center; gap:10px; padding:10px 12px; border-bottom:1px solid #f0f0f0; ${bg}">
        <div style="flex:1; min-width:0;">
          <div style="font-weight:600; font-size:13px;">${esc(i.name)}</div>
          <div style="font-size:12px; color:var(--muted);">${esc(i.next_step)}</div>
        </div>
        ${i.outreacher ? singerChip(i.outreacher.first_name) : ''}
        <span style="font-size:11px; white-space:nowrap; ${dateColor}">${overdue ? 'Overdue' : fmtDateShort(i.next_step_due)}</span>
      </div>`;
    }).join('');
  }
}

// ============================================================
// INSTITUTIONS
// ============================================================
async function loadInstitutions() {
  const { data } = await sb.from('institutions')
    .select('*, outreacher:singers!institutions_outreacher_id_fkey(first_name), gig_singers:gigs(gig_singers(singer_id))')
    .order('status').order('name');

  const container = document.getElementById('inst-list');
  if (!container || !data) return;

  container.innerHTML = data.map(i => {
    const overdue = isOverdue(i.next_step_due);
    return `<div class="inst-card" onclick="showInstitutionDetail('${i.id}')">
      <div class="inst-top">
        <div><div class="inst-name">${esc(i.name)}</div>${i.address ? `<div class="inst-loc">${esc(i.address)}</div>` : ''}</div>
        ${statusBadge(i.status)}
      </div>
      ${i.outreacher ? `<div class="inst-bottom">${singerChip(i.outreacher.first_name)}${overdue ? '<span style="font-size:11px; color:var(--danger); font-weight:600;">Overdue</span>' : ''}</div>` : ''}
    </div>`;
  }).join('');
}

// ============================================================
// OUTREACH PIPELINE
// ============================================================
async function loadOutreach() {
  const { data } = await sb.from('institutions')
    .select('*, outreacher:singers!institutions_outreacher_id_fkey(first_name)')
    .not('status', 'in', '("previous")')
    .order('next_step_due', { ascending: true, nullsFirst: false });

  if (!data) return;

  const stages = {
    initial_contact: { el: 'pipe-initial', items: [] },
    in_conversation: { el: 'pipe-conversation', items: [] },
    site_visit: { el: 'pipe-sitevisit', items: [] },
    active: { el: 'pipe-active', items: [] }
  };

  data.forEach(i => {
    const stage = stages[i.pipeline_stage];
    if (stage) stage.items.push(i);
  });

  Object.entries(stages).forEach(([key, stage]) => {
    const el = document.getElementById(stage.el);
    if (!el) return;
    const countEl = el.closest('.pipeline-col')?.querySelector('.count');
    if (countEl) countEl.textContent = stage.items.length;

    el.innerHTML = stage.items.map(i => {
      const overdue = isOverdue(i.next_step_due);
      const soon = isSoon(i.next_step_due);
      const dateClass = overdue ? 'overdue' : soon ? 'soon' : '';
      const dateText = overdue ? 'Overdue' : fmtDateShort(i.next_step_due);
      const activeStyle = key === 'active' ? 'border-left:3px solid var(--ok);' : '';
      return `<div class="pipeline-card" style="${activeStyle}" onclick="showInstitutionDetail('${i.id}')">
        <div class="pc-name">${esc(i.name)}</div>
        ${i.institution_type ? `<div class="pc-type">${esc(i.institution_type.replace(/_/g,' '))}</div>` : ''}
        <div class="pc-meta">
          ${i.outreacher ? singerChip(i.outreacher.first_name) : ''}
          <span class="pc-date ${dateClass}">${key === 'active' ? recurrenceLabel(i.recurrence) : dateText}</span>
        </div>
      </div>`;
    }).join('');
  });

  // Follow-ups table
  const followups = data.filter(i => i.next_step && !['active','eliminated'].includes(i.status))
    .sort((a, b) => {
      if (!a.next_step_due) return 1;
      if (!b.next_step_due) return -1;
      return new Date(a.next_step_due) - new Date(b.next_step_due);
    }).slice(0, 8);

  const tbody = document.getElementById('outreach-followups');
  if (tbody) {
    tbody.innerHTML = followups.map(i => {
      const overdue = isOverdue(i.next_step_due);
      const soon = isSoon(i.next_step_due);
      const bg = overdue ? 'background:var(--danger-light)' : soon ? 'background:var(--warn-light)' : '';
      const badge = overdue ? '<span class="badge badge-eliminated">Overdue</span>' : soon ? '<span class="badge badge-outreach">Soon</span>' : '<span class="badge badge-pending">Upcoming</span>';
      return `<tr style="${bg}">
        <td>${badge}</td>
        <td><strong>${esc(i.name)}</strong></td>
        <td>${i.outreacher ? singerChip(i.outreacher.first_name) : '—'}</td>
        <td>${esc(i.next_step)}</td>
        <td style="${overdue ? 'font-weight:600; color:var(--danger)' : soon ? 'font-weight:600; color:var(--warn)' : ''}">${fmtDateShort(i.next_step_due)}</td>
        <td><button class="btn btn-sm btn-secondary" onclick="openLogForInstitution('${i.id}')">Log</button></td>
      </tr>`;
    }).join('');
  }
}

// ============================================================
// INSTITUTION DETAIL (dynamic slide-over)
// ============================================================
async function showInstitutionDetail(id) {
  const [{ data: inst }, { data: contacts }, { data: activities }] = await Promise.all([
    sb.from('institutions').select('*, outreacher:singers!institutions_outreacher_id_fkey(first_name)').eq('id', id).single(),
    sb.from('contacts').select('*').eq('institution_id', id).order('is_primary', { ascending: false }),
    sb.from('activities').select('*, singer:singers(first_name)').eq('institution_id', id).order('activity_date', { ascending: false })
  ]);

  if (!inst) return;

  const overdue = isOverdue(inst.next_step_due);
  const daysOverdue = overdue ? Math.floor((new Date() - new Date(inst.next_step_due)) / 86400000) : 0;

  const panel = document.getElementById('dynamic-detail');
  panel.innerHTML = `
    <div class="detail-panel">
      <div class="detail-panel-header">
        <div>
          <h3>${esc(inst.name)}</h3>
          <div class="subtitle">${esc((inst.institution_type || '').replace(/_/g,' '))}${inst.address ? ' · ' + esc(inst.address) : ''}</div>
          <div style="margin-top:6px;">${statusBadge(inst.status)} ${overdue ? '<span class="badge badge-eliminated">Overdue</span>' : ''}</div>
        </div>
        <button class="modal-close" onclick="document.getElementById('dynamic-detail').classList.remove('open')">&times;</button>
      </div>
      <div class="detail-panel-body">
        ${inst.next_step ? `
          <div class="next-step-banner" ${!overdue && inst.pipeline_stage === 'site_visit' ? 'style="background:var(--ok-light); border-color:#8ed1a8;"' : ''}>
            <div class="nsb-label" ${inst.pipeline_stage === 'site_visit' ? 'style="color:var(--ok);"' : ''}>Next Step</div>
            ${esc(inst.next_step)}
            <div class="nsb-due">Due: ${fmtDate(inst.next_step_due)} ${overdue ? `· <strong style="color:var(--danger)">${daysOverdue} days overdue</strong>` : ''}</div>
          </div>
        ` : ''}
        <div class="quick-actions">
          <button class="btn btn-primary btn-sm" onclick="openLogForInstitution('${inst.id}')">Log Activity</button>
          <button class="btn btn-secondary btn-sm" onclick="editInstitution('${inst.id}')">Edit</button>
        </div>
        ${inst.outreacher ? `
          <div class="detail-section"><h4>Outreacher</h4><span class="singer-chip" style="font-size:13px; padding:4px 12px;">${esc(inst.outreacher.first_name)}</span></div>
        ` : ''}
        ${contacts && contacts.length ? `
          <div class="detail-section"><h4>Contacts</h4>
            ${contacts.map(c => `
              <div class="contact-card">
                <div class="cc-name">${esc(c.first_name || '')} ${esc(c.last_name || '')}</div>
                ${c.job_title ? `<div class="cc-title">${esc(c.job_title)}</div>` : ''}
                <div class="cc-info">
                  ${c.phone ? `<a href="tel:${c.phone}">${esc(c.phone)}</a>` : ''}
                  ${c.phone && c.email ? ' · ' : ''}
                  ${c.email ? `<a href="mailto:${c.email}">${esc(c.email)}</a>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}
        <div class="detail-section"><h4>Timeline</h4>
          ${activities && activities.length ? `
            <div class="timeline">
              ${activities.map(a => {
                const typeClass = ['phone_call','voicemail','email_sent','in_person','site_visit','first_sing'].includes(a.activity_type) ? 'action' : a.activity_type === 'status_change' ? 'status-change' : 'note';
                return `<div class="timeline-item ${typeClass}">
                  <div class="tl-date">${fmtDate(a.activity_date)}</div>
                  ${a.singer ? `<div class="tl-author">${esc(a.singer.first_name)}</div>` : ''}
                  <div class="tl-content">${esc(a.description)}</div>
                </div>`;
              }).join('')}
            </div>
          ` : '<p style="color:var(--muted); font-size:13px;">No activity logged yet.</p>'}
        </div>
        ${inst.notes ? `<div class="detail-section"><h4>Notes</h4><p style="font-size:13px;">${esc(inst.notes)}</p></div>` : ''}
      </div>
    </div>
  `;
  panel.classList.add('open');
}

// ============================================================
// SINGERS VIEW
// ============================================================
async function loadSingersView() {
  const container = document.getElementById('singers-list');
  if (!container) return;

  container.innerHTML = singersCache.map(s => {
    const roleLabel = s.role === 'both' ? '<span class="badge badge-active">Singer</span> <span class="badge badge-pending">Outreacher</span>'
      : s.role === 'singer' ? '<span class="badge badge-active">Singer</span>'
      : '<span class="badge badge-pending">Outreacher</span>';
    const availBadge = s.availability === 'available' ? 'badge-active' : s.availability === 'limited' ? 'badge-outreach' : 'badge-inactive';
    return `<div class="singer-card">
      <div class="sc-top"><span class="sc-name">${esc(s.first_name)}</span><div>${roleLabel}</div></div>
      <div style="margin-top:4px;"><span class="badge ${availBadge}">${s.availability}</span></div>
      ${s.notes ? `<div class="sc-note">${esc(s.notes)}</div>` : ''}
    </div>`;
  }).join('');
}

// ============================================================
// SCHEDULE
// ============================================================
async function loadSchedule() {
  const today = new Date().toISOString().split('T')[0];
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);
  const end = endDate.toISOString().split('T')[0];

  const { data: gigs } = await sb.from('gigs')
    .select('*, institution:institutions(name, address), gig_singers(singer_id, is_anchor)')
    .gte('gig_date', today)
    .lte('gig_date', end)
    .order('gig_date')
    .order('gig_time');

  if (!gigs) return;

  // Group by date
  const grouped = {};
  gigs.forEach(g => {
    if (!grouped[g.gig_date]) grouped[g.gig_date] = [];
    grouped[g.gig_date].push(g);
  });

  const listEl = document.getElementById('sched-list-content');
  if (listEl) {
    listEl.innerHTML = Object.entries(grouped).map(([date, dayGigs]) => {
      const dt = new Date(date + 'T00:00:00');
      const dayLabel = dt.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      return `<div class="sched-day-group">
        <div class="sched-day-label"><span class="sched-day-date">${dayLabel}</span><span>${dayGigs.length} gig${dayGigs.length > 1 ? 's' : ''}</span></div>
        ${dayGigs.map(g => {
          const singers = (g.gig_singers || []).map(gs => {
            const name = singerName(gs.singer_id);
            return gs.is_anchor ? `${name} <span class="singer-role">anchor</span>` : name;
          });
          return `<div class="sched-gig">
            <div class="sched-gig-time">${g.gig_time ? g.gig_time.slice(0, 5) : '—'}</div>
            <div class="sched-gig-body">
              <div class="sched-gig-venue">${esc(g.institution?.name)}</div>
              <div class="sched-gig-meta">${recurrenceLabel(g.recurrence)}${g.institution?.address ? ' · ' + esc(g.institution.address) : ''}</div>
              <div class="sched-gig-singers"><div class="singer-chips">${singers.map(s => `<span class="singer-chip">${s}</span>`).join('')}</div></div>
            </div>
            <div class="sched-gig-actions">${g.recurrence ? `<span class="gig-recur">${recurrenceLabel(g.recurrence)}</span>` : ''}</div>
          </div>`;
        }).join('')}
      </div>`;
    }).join('') || '<p style="padding:16px; color:var(--muted);">No upcoming gigs scheduled.</p>';
  }

  // Also load calendar view
  loadCalendar(new Date().getFullYear(), new Date().getMonth());
}

// ============================================================
// CALENDAR VIEW
// ============================================================
let calMonth = new Date().getMonth();
let calYear = new Date().getFullYear();
let calGigsCache = [];

async function loadCalendar(year, month) {
  calYear = year;
  calMonth = month;

  // Fetch gigs for the visible month range (include overflow days)
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  // Expand to cover partial weeks
  const startDay = new Date(first);
  startDay.setDate(startDay.getDate() - first.getDay());
  const endDay = new Date(last);
  endDay.setDate(endDay.getDate() + (6 - last.getDay()));

  const { data: gigs } = await sb.from('gigs')
    .select('*, institution:institutions(name), gig_singers(singer_id, is_anchor)')
    .gte('gig_date', startDay.toISOString().split('T')[0])
    .lte('gig_date', endDay.toISOString().split('T')[0])
    .order('gig_time');

  calGigsCache = gigs || [];
  renderCalendar();
}

function renderCalendar() {
  const container = document.getElementById('cal-container');
  if (!container) return;

  const today = new Date().toISOString().split('T')[0];
  const first = new Date(calYear, calMonth, 1);
  const last = new Date(calYear, calMonth + 1, 0);
  const monthLabel = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Build gigs-by-date map
  const gigsByDate = {};
  calGigsCache.forEach(g => {
    if (!gigsByDate[g.gig_date]) gigsByDate[g.gig_date] = [];
    gigsByDate[g.gig_date].push(g);
  });

  // Navigation
  let html = `<div class="cal-nav">
    <button onclick="calPrev()">&lsaquo; Prev</button>
    <span class="cal-month-label">${monthLabel}</span>
    <button onclick="calNext()">Next &rsaquo;</button>
  </div>`;

  // Grid header
  html += '<div class="cal-grid">';
  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => {
    html += `<div class="cal-hdr">${d}</div>`;
  });

  // Fill cells starting from the Sunday before the 1st
  const cursor = new Date(first);
  cursor.setDate(cursor.getDate() - first.getDay());

  while (cursor <= last || cursor.getDay() !== 0) {
    const dateStr = cursor.toISOString().split('T')[0];
    const isOther = cursor.getMonth() !== calMonth;
    const isToday = dateStr === today;
    const classes = ['cal-cell'];
    if (isOther) classes.push('other-month');
    if (isToday) classes.push('today');

    const dayGigs = gigsByDate[dateStr] || [];
    const dots = dayGigs.map(g => {
      const timeAttr = g.gig_time ? `data-time="${g.gig_time.slice(0, 5)}"` : '';
      const timeClass = g.gig_time ? ' has-time' : '';
      return `<div class="cal-dot${timeClass}" ${timeAttr}>${esc(g.institution?.name || '')}</div>`;
    }).join('');

    html += `<div class="${classes.join(' ')}">
      <div class="cal-day-num">${cursor.getDate()}</div>
      <div class="cal-dots">${dots}</div>
    </div>`;

    cursor.setDate(cursor.getDate() + 1);
  }

  html += '</div>';
  container.innerHTML = html;
}

function calPrev() {
  let m = calMonth - 1, y = calYear;
  if (m < 0) { m = 11; y--; }
  loadCalendar(y, m);
}

function calNext() {
  let m = calMonth + 1, y = calYear;
  if (m > 11) { m = 0; y++; }
  loadCalendar(y, m);
}

// ============================================================
// FORM SUBMISSIONS
// ============================================================
async function submitLogActivity(form) {
  const fd = new FormData(form);
  const institutionId = fd.get('institution_id');
  if (!institutionId) { alert('Select an institution'); return; }

  // Insert activity
  const { error: actErr } = await sb.from('activities').insert({
    institution_id: institutionId,
    singer_id: fd.get('singer_id') || null,
    activity_type: fd.get('activity_type'),
    activity_date: fd.get('activity_date'),
    contact_person: fd.get('contact_person') || null,
    description: fd.get('description')
  });
  if (actErr) { alert('Error: ' + actErr.message); return; }

  // Update next step if provided
  const nextStep = fd.get('next_step');
  const nextDue = fd.get('next_step_due');
  const newStage = fd.get('new_stage');
  const updates = {};
  if (nextStep) updates.next_step = nextStep;
  if (nextDue) updates.next_step_due = nextDue;
  if (newStage) updates.pipeline_stage = newStage;

  if (Object.keys(updates).length) {
    await sb.from('institutions').update(updates).eq('id', institutionId);
  }

  closeModal('log-activity-modal');
  form.reset();
  loadAll();
}

async function submitInstitution(form) {
  const fd = new FormData(form);
  const { error } = await sb.from('institutions').insert({
    name: fd.get('name'),
    institution_type: fd.get('institution_type') || null,
    status: fd.get('status'),
    address: fd.get('address') || null,
    outreacher_id: fd.get('outreacher_id') || null,
    next_step: fd.get('next_step') || null,
    next_step_due: fd.get('next_step_due') || null
  });
  if (error) { alert('Error: ' + error.message); return; }

  // Add contact if provided
  const cName = fd.get('contact_first_name');
  if (cName) {
    // Get the new institution's ID (last inserted)
    const { data: newest } = await sb.from('institutions').select('id').eq('name', fd.get('name')).order('created_at', { ascending: false }).limit(1);
    if (newest && newest[0]) {
      await sb.from('contacts').insert({
        institution_id: newest[0].id,
        first_name: cName,
        last_name: fd.get('contact_last_name') || null,
        job_title: fd.get('contact_title') || null,
        phone: fd.get('contact_phone') || null,
        email: fd.get('contact_email') || null
      });
    }
  }

  closeModal('institution-modal');
  form.reset();
  loadAll();
}

async function submitSinger(form) {
  const fd = new FormData(form);
  const { error } = await sb.from('singers').insert({
    first_name: fd.get('first_name'),
    role: fd.get('role'),
    availability: fd.get('availability'),
    preferred_days: fd.get('preferred_days') || null,
    notes: fd.get('notes') || null
  });
  if (error) { alert('Error: ' + error.message); return; }
  closeModal('singer-modal');
  form.reset();
  loadAll();
}

async function submitGig(form) {
  const fd = new FormData(form);
  const institutionId = fd.get('institution_id');
  if (!institutionId) { alert('Select a venue'); return; }

  const { data: gig, error } = await sb.from('gigs').insert({
    institution_id: institutionId,
    gig_date: fd.get('gig_date'),
    gig_time: fd.get('gig_time') || null,
    recurrence: fd.get('recurrence'),
    recurrence_end: fd.get('recurrence_end') || null,
    notes: fd.get('gig_notes') || null
  }).select().single();

  if (error) { alert('Error: ' + error.message); return; }

  // Add singers
  const singerIds = [fd.get('singer1'), fd.get('singer2'), fd.get('singer3')].filter(Boolean);
  if (singerIds.length && gig) {
    await sb.from('gig_singers').insert(
      singerIds.map((sid, i) => ({ gig_id: gig.id, singer_id: sid, is_anchor: i === 0 }))
    );
  }

  closeModal('gig-modal');
  form.reset();
  loadAll();
}

// ============================================================
// HELPERS
// ============================================================
function openLogForInstitution(id) {
  const sel = document.querySelector('#log-activity-modal select[name="institution_id"]');
  if (sel) sel.value = id;
  openModal('log-activity-modal');
}

function editInstitution(id) {
  // TODO: populate edit form
  alert('Edit form coming soon - for now use Log Activity to update next step');
}

function populateSingerDropdowns() {
  document.querySelectorAll('select[data-singer-list]').forEach(sel => {
    const currentVal = sel.value;
    const placeholder = sel.dataset.placeholder || 'Select...';
    sel.innerHTML = `<option value="">${placeholder}</option>` +
      singersCache.map(s => `<option value="${s.id}">${esc(s.first_name)}</option>`).join('');
    if (currentVal) sel.value = currentVal;
  });
}

async function populateInstitutionDropdowns() {
  const { data } = await sb.from('institutions').select('id, name').order('name');
  document.querySelectorAll('select[data-institution-list]').forEach(sel => {
    const currentVal = sel.value;
    sel.innerHTML = '<option value="">Select...</option>' +
      (data || []).map(i => `<option value="${i.id}">${esc(i.name)}</option>`).join('');
    if (currentVal) sel.value = currentVal;
  });
}

// ============================================================
// SEARCH & FILTER (client-side)
// ============================================================
function setupSearch(inputSelector, containerSelector, cardSelector) {
  const input = document.querySelector(inputSelector);
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    document.querySelectorAll(`${containerSelector} ${cardSelector}`).forEach(card => {
      card.style.display = card.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
}

// Run on load
document.addEventListener('DOMContentLoaded', () => {
  init().catch(err => {
    const status = document.getElementById('login-status');
    if (status) status.textContent = 'Error: ' + err.message;
    console.error('TSEB init failed:', err);
  });
  setupSearch('#inst-search', '#inst-list', '.inst-card');
  setupSearch('#singer-search', '#singers-list', '.singer-card');
});
