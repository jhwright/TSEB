// TSEB Feedback module — collect tester/user feedback, notify via email
TSEB.feedback = {
  open: function(context) {
    var screen = document.querySelector('.tab.active');
    var screenName = screen ? screen.dataset.screen : 'unknown';
    var contextNote = context || ('Screen: ' + screenName);

    TSEB.showForm(
      '<div class="modal-header">' +
      '<button class="modal-back-btn" onclick="TSEB.closeForm()" aria-label="Cancel">&#8592;</button>' +
      '<div class="modal-title">Send Feedback</div>' +
      '</div>' +
      '<div class="modal-body">' +
      '<p style="font-size:16px; color:var(--muted); margin-bottom:20px;">Found a bug? Have a suggestion? Let us know — your feedback helps make this app better for everyone.</p>' +
      '<form onsubmit="event.preventDefault(); TSEB.feedback.submit(this);">' +
      '<input type="hidden" name="context" value="' + TSEB.util.esc(contextNote) + '">' +

      '<div class="form-group">' +
      '<label class="form-label">Your Name (optional)</label>' +
      '<input type="text" name="name" class="form-input" placeholder="So we can follow up">' +
      '</div>' +

      '<div class="form-group">' +
      '<label class="form-label">What kind of feedback?</label>' +
      '<select name="type" class="form-input form-select">' +
      '<option value="bug">Something is broken</option>' +
      '<option value="suggestion">I have a suggestion</option>' +
      '<option value="question">I have a question</option>' +
      '<option value="praise">Something is great!</option>' +
      '</select>' +
      '</div>' +

      '<div class="form-group">' +
      '<label class="form-label">Tell us more</label>' +
      '<textarea name="message" class="form-input" rows="4" required placeholder="What happened? What did you expect?"></textarea>' +
      '</div>' +

      '<button type="submit" class="btn btn-primary" style="width:100%; margin-top:8px;">Send Feedback</button>' +
      '</form>' +
      '</div>'
    );
  },

  async submit(form) {
    var fd = new FormData(form);
    var name = fd.get('name') || 'Anonymous';
    var type = fd.get('type');
    var message = fd.get('message');
    var context = fd.get('context');

    if (!message) { TSEB.toast('Please describe your feedback', 'warning'); return; }

    // Try to save to Supabase feedback table (may not exist yet — that's OK)
    try {
      await TSEB.sb.from('feedback').insert({
        name: name,
        type: type,
        message: message,
        context: context,
        url: window.location.href,
        user_agent: navigator.userAgent
      });
    } catch (e) {
      // Table may not exist — fall through to email
    }

    // Send email notification
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
    TSEB.toast('Thanks for your feedback!', 'success');
  }
};
