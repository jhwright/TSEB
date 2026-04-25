// TSEB Guide module — manuscript-style help overlay
TSEB.guide = {
  show: function(screen) {
    if (!screen) {
      var active = document.querySelector('.tab.active');
      screen = active ? active.dataset.screen : 'outreach';
    }
    var c = this._content(screen);
    var overlay = document.getElementById('guide-overlay');
    overlay.innerHTML =
      '<div class="guide-content">' +
        '<div class="guide-topbar">' +
          '<div class="smcaps faint">Guide</div>' +
          '<button type="button" class="guide-close" onclick="TSEB.guide.hide()" aria-label="Close">×</button>' +
        '</div>' +
        '<div class="guide-eyebrow">' + c.eyebrow + '</div>' +
        '<h2 class="guide-title">' + c.title + '</h2>' +
        '<p class="guide-lede">' + c.lede + '</p>' +
        '<div class="guide-rule"></div>' +
        c.body +
        '<button type="button" class="guide-dismiss" onclick="TSEB.guide.hide()">Return to the work</button>' +
      '</div>';
    overlay.style.display = 'flex';
    requestAnimationFrame(function() {
      requestAnimationFrame(function() { overlay.classList.add('guide-open'); });
    });
  },

  hide: function() {
    var overlay = document.getElementById('guide-overlay');
    overlay.classList.remove('guide-open');
    setTimeout(function() { overlay.style.display = 'none'; }, 200);
  },

  _section: function(label, body) {
    return '<div class="guide-section">' +
      '<div class="smcaps accent guide-section-label">' + label + '</div>' +
      '<div class="guide-section-body">' + body + '</div>' +
      '</div>';
  },

  _content: function(screen) {
    var sec = this._section;
    var contents = {
      outreach: {
        eyebrow: 'Chapter I',
        title: 'Outreach',
        lede: 'Tend the network of care facilities — from first contact to active venue.',
        body:
          sec('The callout',
            'A line at the top surfaces follow-ups that are <em>overdue</em> or <em>due this week</em>. Tend to those before anything else.') +
          sec('Filter & status',
            'Toggle <em>All</em> versus <em>Mine</em> to narrow to facilities you carry. Status pills below show counts at each stage.') +
          sec('Cards',
            'Each card shows the facility, its status pill, and the next step. Tap to open the full record — contacts, history, status changes.') +
          sec('The plus',
            'The ochre circle in the corner adds a new facility to the roster.')
      },
      schedule: {
        eyebrow: 'Chapter II',
        title: 'Schedule',
        lede: 'Three lenses on the same gigs — pick whichever fits the question you’re asking.',
        body:
          sec('Calendar',
            'A month grid. Ochre dots mark days with gigs. Tap a day to scroll the list below to that date.') +
          sec('Agenda',
            'A timeline of upcoming sessions. The italic numerals are dates; venue, time, and assigned singers sit on the right.') +
          sec('Map',
            'East Bay venues plotted on a quiet map. Pins are numbered so you can match each one to the timeline below.') +
          sec('Gig detail',
            'Tap any gig to see the venue, the assigned singers (the anchor is marked), and a link to open the facility record.')
      },
      singers: {
        eyebrow: 'Chapter III',
        title: 'Singers',
        lede: 'The volunteer roster — filterable by readiness, groupable by role.',
        body:
          sec('Filter',
            '<em>All</em>, <em>Ready</em>, or <em>Limited</em>. Use Ready to see who can be staffed today.') +
          sec('Group',
            'Group by <em>Status</em> (Available · Limited · Unavailable) or by <em>Role</em> (Singers · Outreachers · Both).') +
          sec('Singer detail',
            'Tap a singer to see availability, limitation notes (when limited), and any upcoming gigs they’re on.') +
          sec('Limitations',
            'When availability is set to <em>Limited</em>, a small block appears for preferred days and a note for the coordinator.')
      }
    };
    return contents[screen] || contents.outreach;
  }
};
