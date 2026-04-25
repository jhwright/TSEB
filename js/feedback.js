// TSEB Feedback module — manuscript-style feedback form, notify via email
TSEB.feedback = {
  open: function(context) {
    var screen = document.querySelector('.tab.active');
    var screenName = screen ? screen.dataset.screen : 'unknown';
    var contextNote = context || ('Screen: ' + screenName);

    TSEB.showForm(
      '<div class="form-topbar">' +
        '<button type="button" class="topbar-link" onclick="TSEB.closeForm()">← Cancel</button>' +
        '<button type="button" class="topbar-link topbar-link-accent" onclick="document.getElementById(\'feedback-form\').requestSubmit()">Send</button>' +
      '</div>' +
      '<form id="feedback-form" class="form-body" onsubmit="event.preventDefault(); TSEB.feedback.submit(this);">' +
        '<div class="smcaps faint">Send feedback</div>' +
        '<h2 class="form-title">A note to the coordinator</h2>' +
        '<p class="form-italic-note">A bug, a suggestion, or simply an observation — anything that helps shape this tool.</p>' +

        '<input type="hidden" name="context" value="' + TSEB.util.esc(contextNote) + '">' +

        '<label class="smcaps faint form-eyebrow-label">Your name <span class="form-optional">— optional</span></label>' +
        '<input type="text" name="name" class="form-input form-input-italic" placeholder="So we can follow up">' +

        '<label class="smcaps faint form-eyebrow-label">Kind of note</label>' +
        '<div class="form-pill-row" id="feedback-type-row">' +
          '<button type="button" class="status-pill activity-type-btn is-active" data-type="bug" onclick="TSEB.feedback._pickType(this)">Bug</button>' +
          '<button type="button" class="status-pill activity-type-btn" data-type="suggestion" onclick="TSEB.feedback._pickType(this)">Suggestion</button>' +
          '<button type="button" class="status-pill activity-type-btn" data-type="question" onclick="TSEB.feedback._pickType(this)">Question</button>' +
          '<button type="button" class="status-pill activity-type-btn" data-type="praise" onclick="TSEB.feedback._pickType(this)">Praise</button>' +
        '</div>' +
        '<input type="hidden" name="type" id="feedback-type-input" value="bug">' +

        '<label class="smcaps faint form-eyebrow-label">What happened?</label>' +
        '<textarea name="message" class="form-input form-input-italic" rows="5" required placeholder="What did you expect — what did you see instead?"></textarea>' +
      '</form>'
    );
  },

  _pickType: function(btn) {
    var row = document.getElementById('feedback-type-row');
    if (row) Array.from(row.querySelectorAll('.activity-type-btn')).forEach(function(b) { b.classList.remove('is-active'); });
    btn.classList.add('is-active');
    var input = document.getElementById('feedback-type-input');
    if (input) input.value = btn.dataset.type;
  },

  submit: async function(form) {
    var fd = new FormData(form);
    var name = fd.get('name') || 'Anonymous';
    var type = fd.get('type') || 'bug';
    var message = fd.get('message');
    var context = fd.get('context');

    if (!message) { TSEB.toast('A note is needed before sending.', 'warning'); return; }

    try {
      await TSEB.sb.from('feedback').insert({
        name: name,
        type: type,
        message: message,
        context: context,
        url: window.location.href,
        user_agent: navigator.userAgent
      });
    } catch (e) { /* table may not exist — fall through to email */ }

    var subject = encodeURIComponent('TSEB Feedback: ' + type);
    var body = encodeURIComponent(
      'From: ' + name + '\n' +
      'Type: ' + type + '\n' +
      'Context: ' + context + '\n' +
      'URL: ' + window.location.href + '\n' +
      'Time: ' + new Date().toLocaleString() + '\n\n' +
      message
    );
    window.open('mailto:jhwright@gmail.com?subject=' + subject + '&body=' + body, '_self');

    TSEB.closeForm();
    TSEB.toast('Sent — thank you.', 'success');
  }
};
