// TSEB Guide module — help overlay
TSEB.guide = {
  show(screen) {
    // Determine current screen if not specified
    if (!screen) {
      const active = document.querySelector('.tab.active');
      screen = active ? active.dataset.screen : 'outreach';
    }

    const content = this._content(screen);
    const overlay = document.getElementById('guide-overlay');

    overlay.innerHTML =
      '<div style="background:var(--surface); border-radius:var(--radius-lg); width:100%; max-width:480px; max-height:80vh; overflow-y:auto; padding:28px; position:relative;">' +
      '<button onclick="TSEB.guide.hide()" style="position:absolute; top:16px; right:16px; background:none; border:none; font-size:24px; cursor:pointer; color:var(--muted); line-height:1;" aria-label="Close">&times;</button>' +
      '<div style="font-family:var(--font-display); font-size:22px; font-weight:700; color:var(--primary); margin-bottom:6px;">' + content.title + '</div>' +
      '<div style="font-size:15px; color:var(--muted); margin-bottom:20px;">' + content.subtitle + '</div>' +
      content.body +
      '<button class="btn btn-primary" style="width:100%; margin-top:24px;" onclick="TSEB.guide.hide()">Got it</button>' +
      '</div>';

    overlay.style.display = 'flex';
  },

  hide() {
    document.getElementById('guide-overlay').style.display = 'none';
  },

  _content(screen) {
    const contents = {
      outreach: {
        title: 'Outreach',
        subtitle: 'Track care facilities from first contact to active venue.',
        body:
          '<div style="display:flex; flex-direction:column; gap:14px;">' +

          '<div style="background:var(--accent-light); border-radius:var(--radius-sm); padding:14px;">' +
          '<div style="font-weight:700; margin-bottom:4px;">Orange callout at the top</div>' +
          '<div style="font-size:15px; color:var(--text);">Shows how many follow-ups are overdue or due this week — act on these first.</div>' +
          '</div>' +

          '<div style="background:var(--primary-light); border-radius:var(--radius-sm); padding:14px;">' +
          '<div style="font-weight:700; margin-bottom:4px;">Status pills</div>' +
          '<div style="font-size:15px; color:var(--text);">Quick count of facilities at each stage. Overdue cards sort to the top.</div>' +
          '</div>' +

          '<div style="background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-sm); padding:14px;">' +
          '<div style="font-weight:700; margin-bottom:4px;">Tap a facility card</div>' +
          '<div style="font-size:15px; color:var(--text);">Opens the full detail: contacts, timeline, and status change buttons. From there you can log activity or edit the record.</div>' +
          '</div>' +

          '<div style="background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-sm); padding:14px;">' +
          '<div style="font-weight:700; margin-bottom:4px;">+ button (bottom right)</div>' +
          '<div style="font-size:15px; color:var(--text);">Add a new care facility to your outreach list.</div>' +
          '</div>' +

          '<div style="background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-sm); padding:14px;">' +
          '<div style="font-weight:700; margin-bottom:4px;">All / Mine filter</div>' +
          '<div style="font-size:15px; color:var(--text);">Switch to Mine to see only facilities assigned to you.</div>' +
          '</div>' +

          '</div>'
      },

      schedule: {
        title: 'Schedule',
        subtitle: 'Upcoming singing gigs at active venues.',
        body:
          '<div style="display:flex; flex-direction:column; gap:14px;">' +

          '<div style="background:var(--primary-light); border-radius:var(--radius-sm); padding:14px;">' +
          '<div style="font-weight:700; margin-bottom:4px;">Gigs grouped by month</div>' +
          '<div style="font-size:15px; color:var(--text);">All upcoming gigs are shown, starting from today, sorted by date.</div>' +
          '</div>' +

          '<div style="background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-sm); padding:14px;">' +
          '<div style="font-weight:700; margin-bottom:4px;">Tap a gig</div>' +
          '<div style="font-size:15px; color:var(--text);">Opens the gig detail with venue address, contact info, and the assigned singers. You can navigate to the facility from here too.</div>' +
          '</div>' +

          '<div style="background:var(--accent-light); border-radius:var(--radius-sm); padding:14px;">' +
          '<div style="font-weight:700; margin-bottom:4px;">Singer chips</div>' +
          '<div style="font-size:15px; color:var(--text);">Green chips show assigned singers. The anchor singer is marked — they\'re the primary contact for that gig.</div>' +
          '</div>' +

          '</div>'
      },

      singers: {
        title: 'Singers',
        subtitle: 'The volunteer roster for Threshold Singers East Bay.',
        body:
          '<div style="display:flex; flex-direction:column; gap:14px;">' +

          '<div style="background:var(--primary-light); border-radius:var(--radius-sm); padding:14px;">' +
          '<div style="font-weight:700; margin-bottom:4px;">Grouped by availability</div>' +
          '<div style="font-size:15px; color:var(--text);">Singers are shown in three groups: Available, Limited, and Unavailable. Use this to staff gigs.</div>' +
          '</div>' +

          '<div style="background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-sm); padding:14px;">' +
          '<div style="font-weight:700; margin-bottom:4px;">Roles</div>' +
          '<div style="font-size:15px; color:var(--text);">Some volunteers are singers, some handle outreach, and some do both. The badge on each card shows their role.</div>' +
          '</div>' +

          '<div style="background:var(--bg); border:1px solid var(--border); border-radius:var(--radius-sm); padding:14px;">' +
          '<div style="font-weight:700; margin-bottom:4px;">Adding or editing singers</div>' +
          '<div style="font-size:15px; color:var(--text);">Singer records are managed by the coordinator. Contact your coordinator to add someone or update availability.</div>' +
          '</div>' +

          '</div>'
      }
    };

    return contents[screen] || contents.outreach;
  }
};
