// TSEB App — Core namespace, utilities, navigation
window.TSEB = {};

// Supabase client (initialized after config.js loads)
TSEB.sb = null;

// Current user's singer record (set after auth)
TSEB.currentSinger = null;

// Navigation
TSEB.nav = function(screen) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const el = document.getElementById('screen-' + screen);
  const btn = document.querySelector('.nav-btn[data-screen="' + screen + '"]');
  if (el) el.classList.add('active');
  if (btn) btn.classList.add('active');
  // Lazy-load: fetch data on first tab switch
  if (screen === 'schedule' && !TSEB.schedule._loaded) TSEB.schedule.load();
  if (screen === 'singers' && !TSEB.singers._loaded) TSEB.singers.load();
  if (screen === 'outreach' && !TSEB.outreach._loaded) TSEB.outreach.load();
  document.dispatchEvent(new CustomEvent('tseb:navigated', { detail: { screen } }));
};

// Toast notifications
TSEB.toast = function(message, type) {
  type = type || 'info';
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.textContent = message;
  toast.style.pointerEvents = 'auto';
  container.appendChild(toast);
  // Trigger animation on next frame
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('toast-visible'));
  });
  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

// Show/hide loading skeletons
TSEB.showSkeleton = function(containerId, count) {
  count = count || 3;
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = Array(count).fill('<div class="skeleton skeleton-card"></div>').join('');
};

// Show form overlay (full-screen on mobile)
TSEB.showForm = function(html) {
  const overlay = document.getElementById('form-overlay');
  const container = document.getElementById('form-container');
  container.innerHTML = html;
  overlay.style.display = 'flex';
  // Trigger slide-in animation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => container.classList.add('modal-open'));
  });
};

TSEB.closeForm = function() {
  const container = document.getElementById('form-container');
  container.classList.remove('modal-open');
  setTimeout(() => {
    document.getElementById('form-overlay').style.display = 'none';
    container.innerHTML = '';
  }, 300);
};

// Show detail overlay
TSEB.showDetail = function(html) {
  const overlay = document.getElementById('detail-overlay');
  const container = document.getElementById('detail-container');
  container.innerHTML = html;
  overlay.style.display = 'flex';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => container.classList.add('modal-open'));
  });
};

TSEB.closeDetail = function() {
  const container = document.getElementById('detail-container');
  container.classList.remove('modal-open');
  setTimeout(() => {
    document.getElementById('detail-overlay').style.display = 'none';
    container.innerHTML = '';
  }, 300);
};

// Utilities namespace
TSEB.util = {};

TSEB.util.esc = function(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
};

TSEB.util.fmtDate = function(d) {
  if (!d) return '—';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

TSEB.util.fmtDateShort = function(d) {
  if (!d) return '—';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

TSEB.util.todayStr = function() {
  return new Date().toISOString().split('T')[0];
};

TSEB.util.isOverdue = function(d) {
  if (!d) return false;
  return new Date(d) < new Date(new Date().toDateString());
};

TSEB.util.isSoon = function(d) {
  if (!d) return false;
  const dt = new Date(d);
  const now = new Date(new Date().toDateString());
  const week = new Date(now);
  week.setDate(week.getDate() + 7);
  return dt >= now && dt <= week;
};

TSEB.util.statusBadge = function(status) {
  const map = {
    active: 'badge-active',
    initial_contact: 'badge-initial',
    in_conversation: 'badge-conversation',
    site_visit: 'badge-conversation',
    on_hold: 'badge-muted',
    previous: 'badge-muted',
    inactive: 'badge-overdue'
  };
  const label = (status || '').replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
  return '<span class="badge ' + (map[status] || 'badge-muted') + '">' + label + '</span>';
};

TSEB.util.fmtTime = function(t) {
  if (!t) return '';
  var parts = t.slice(0, 5).split(':');
  var h = parseInt(parts[0], 10);
  var m = parts[1];
  var ampm = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return h + ':' + m + ' ' + ampm;
};

TSEB.util.recurrenceLabel = function(r) {
  const map = { weekly: 'Weekly', biweekly: 'Biweekly', '2x_month': '2x/mo', monthly: 'Monthly', one_time: 'One-time' };
  return map[r] || r || '';
};

TSEB.util.singerChip = function(name) {
  return '<span class="singer-chip">' + TSEB.util.esc(name) + '</span>';
};

// Singers cache (loaded once, shared across modules)
TSEB.singersCache = [];

TSEB.util.singerName = function(id) {
  const s = TSEB.singersCache.find(function(s) { return s.id === id; });
  return s ? s.first_name : '—';
};

// Populate singer dropdowns
TSEB.util.populateSingerDropdowns = function() {
  document.querySelectorAll('select[data-singer-list]').forEach(function(sel) {
    const currentVal = sel.value;
    const placeholder = sel.dataset.placeholder || 'Select...';
    sel.innerHTML = '<option value="">' + placeholder + '</option>' +
      TSEB.singersCache.map(function(s) {
        return '<option value="' + s.id + '">' + TSEB.util.esc(s.first_name) + '</option>';
      }).join('');
    if (currentVal) sel.value = currentVal;
  });
};

// Init
document.addEventListener('DOMContentLoaded', function() {
  // Verify all modules registered
  const required = ['auth', 'outreach', 'schedule', 'singers', 'guide'];
  const missing = required.filter(function(m) { return !TSEB[m]; });
  if (missing.length) {
    document.body.innerHTML = '<div style="padding:2rem; font-family:system-ui; text-align:center;"><h2>Something went wrong</h2><p style="margin:1rem 0;">The app couldn\'t load properly. Please <button onclick="location.reload()" style="color:#4a6741; text-decoration:underline; border:none; background:none; font-size:inherit; cursor:pointer;">refresh the page</button>.</p><p style="color:#6B7280; font-size:14px;">If this keeps happening, contact your choir coordinator.</p></div>';
    return;
  }

  // Initialize Supabase
  if (typeof supabase === 'undefined') {
    document.getElementById('cdn-error').style.display = 'block';
    return;
  }
  TSEB.sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Start auth flow (auth will show login or app)
  TSEB.auth.init();
});
