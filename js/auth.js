// TSEB Auth module — magic link login, session management
TSEB.auth = {
  async init() {
    // DEV MODE: Skip auth, go straight to app
    // TODO: Re-enable auth before launch
    await this._loadSingers();
    this._showApp();
  },

  async _loadSingers() {
    const { data } = await TSEB.sb.from('singers').select('*').order('first_name');
    TSEB.singersCache = data || [];
  },

  _showApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    // Set greeting if we have a singer match
    if (TSEB.currentSinger) {
      document.getElementById('header-greeting').textContent = 'Hi, ' + TSEB.currentSinger.first_name;
    }
    // Load default tab (outreach)
    TSEB.outreach.load();
  },

  _showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
  },

  async sendMagicLink(email) {
    if (!email) {
      TSEB.toast('Please enter your email address', 'warning');
      return;
    }
    const btn = document.getElementById('login-btn');
    btn.disabled = true;
    btn.textContent = 'Sending...';
    try {
      const { error } = await TSEB.sb.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin + window.location.pathname }
      });
      if (error) {
        TSEB.toast('Login failed: ' + error.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Send Me a Login Link';
      } else {
        document.getElementById('login-form').innerHTML =
          '<div style="background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-md); padding:32px; text-align:center;">' +
          '<div style="font-size:48px; margin-bottom:16px;">📬</div>' +
          '<div style="font-family:var(--font-display); font-size:22px; font-weight:600; color:var(--primary); margin-bottom:12px;">Check your email</div>' +
          '<div style="font-size:17px; color:var(--text); margin-bottom:8px;">We sent a login link to</div>' +
          '<div style="font-size:17px; font-weight:600; color:var(--text); margin-bottom:20px;">' + TSEB.util.esc(email) + '</div>' +
          '<p style="font-size:15px; color:var(--muted);">Click the link in the email to sign in. You can close this tab.</p>' +
          '<p style="font-size:14px; color:var(--muted); margin-top:16px;">Didn\'t get it? Check your spam folder or <button onclick="document.getElementById(\'login-form\').innerHTML=TSEB.auth._loginFormHTML()" style="color:var(--primary); text-decoration:underline; border:none; background:none; font-size:inherit; cursor:pointer;">try again</button>.</p>' +
          '</div>';
      }
    } catch (err) {
      TSEB.toast('Error: ' + err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Send Me a Login Link';
    }
  },

  _loginFormHTML() {
    return '<div style="background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-md); padding:28px;">' +
      '<h2 style="font-family:var(--font-display); font-size:22px; font-weight:600; margin-bottom:8px;">Sign in</h2>' +
      '<p style="font-size:16px; color:var(--muted); margin-bottom:24px;">Enter your email address and we\'ll send you a sign-in link — no password needed.</p>' +
      '<div class="form-group">' +
      '<label class="form-label" for="login-email">Email address</label>' +
      '<input type="email" id="login-email" name="email" class="form-input" placeholder="you@example.com" autocomplete="email" autocapitalize="none" inputmode="email" onkeydown="if(event.key===\'Enter\') TSEB.auth.sendMagicLink(document.getElementById(\'login-email\').value.trim())">' +
      '</div>' +
      '<button id="login-btn" class="btn btn-primary" style="width:100%; margin-top:8px;" onclick="TSEB.auth.sendMagicLink(document.getElementById(\'login-email\').value.trim())">Send Me a Login Link</button>' +
      '<p style="font-size:14px; color:var(--muted); margin-top:20px; text-align:center;">Only active TSEB members can sign in. Contact your coordinator if you have trouble.</p>' +
      '</div>';
  },

  async signOut() {
    await TSEB.sb.auth.signOut();
    this._showLogin();
  }
};
