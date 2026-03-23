// TSEB Auth module — currently open access, no login required
TSEB.auth = {
  async init() {
    // No auth — go straight to app
    await this._loadSingers();
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    TSEB.outreach.load();
  },

  async _loadSingers() {
    var { data } = await TSEB.sb.from('singers').select('*').order('first_name');
    TSEB.singersCache = data || [];
  }
};
