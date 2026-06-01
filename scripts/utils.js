// ─────────────────────────────────────────────
// Shared Utilities — loaded on every app page
// ─────────────────────────────────────────────
window.TobUtils = {

  getRelativeTime(dateStr) {
    const now            = new Date();
    const date           = new Date(dateStr);
    const secondsElapsed = Math.floor((now - date) / 1000);
    if (secondsElapsed < 60)     return 'just now';
    if (secondsElapsed < 3600)   return Math.floor(secondsElapsed / 60)   + ' min ago';
    if (secondsElapsed < 86400)  return Math.floor(secondsElapsed / 3600) + ' hr ago';
    if (secondsElapsed < 604800) return Math.floor(secondsElapsed / 86400) + 'd ago';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },

  formatCount(n) {
    if (!n || n === 0) return '0';
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1000)    return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
  },

  escapeHtml(rawString) {
    const el = document.createElement('div');
    el.textContent = rawString;
    return el.innerHTML;
  },

  escapeAttr(rawString) {
    return rawString
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  },

  showToast(message) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  },

  heartIcon(isFilled) {
    const color = isFilled ? '#DC143C' : 'currentColor';
    return `<svg xmlns="http://www.w3.org/2000/svg" id="Filled" viewBox="0 0 24 24" fill="${color}" style="width:14px;height:14px;flex-shrink:0;"><path d="M17.5,1.917a6.4,6.4,0,0,0-5.5,3.3,6.4,6.4,0,0,0-5.5-3.3A6.8,6.8,0,0,0,0,8.967c0,4.547,4.786,9.513,8.8,12.88a4.974,4.974,0,0,0,6.4,0C19.214,18.48,24,13.514,24,8.967A6.8,6.8,0,0,0,17.5,1.917Z"/></svg>`;
  },

  starIcon(isFilled) {
    const color = isFilled ? '#00674F' : 'currentColor';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" style="width:14px;height:14px;flex-shrink:0;"><path d="M21.526,8.284L13.937,.879C13.278,.219,12.33-.104,11.409,.028L4.521,.97c-.547,.075-.93,.579-.855,1.126,.075,.547,.578,.929,1.127,.855l6.889-.942c.306-.042,.622,.063,.851,.292l7.59,7.405c1.045,1.045,1.147,2.68,.323,3.847-.234-.467-.523-.912-.911-1.3l-7.475-7.412c-.658-.658-1.597-.975-2.528-.851l-6.889,.942c-.454,.062-.808,.425-.858,.881l-.765,6.916c-.1,.911,.214,1.804,.864,2.453l7.416,7.353c.944,.945,2.199,1.464,3.534,1.464h.017c1.342-.004,2.6-.532,3.543-1.487l3.167-3.208c.927-.939,1.393-2.159,1.423-3.388l.577-.576c1.925-1.95,1.914-5.112-.032-7.057Zm-15.526,1.716c-.552,0-1-.448-1-1,.006-1.308,1.994-1.307,2,0,0,.552-.448,1-1,1Z"/></svg>`;
  },

  commentIcon() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px;flex-shrink:0;"><path d="m12.836.029c-3.474-.235-6.875,1.036-9.328,3.492S-.211,9.378.03,12.854c.44,6.354,6.052,11.146,13.054,11.146h5.917c2.757,0,5-2.243,5-5v-6.66C24,5.862,19.096.454,12.836.029Zm-5.836,13.471c-.828,0-1.5-.672-1.5-1.5s.672-1.5,1.5-1.5,1.5.672,1.5,1.5-.672,1.5-1.5,1.5Zm5,0c-.828,0-1.5-.672-1.5-1.5s.672-1.5,1.5-1.5,1.5.672,1.5,1.5-.672,1.5-1.5,1.5Zm5,0c-.828,0-1.5-.672-1.5-1.5s.672-1.5,1.5-1.5,1.5.672,1.5,1.5-.672,1.5-1.5,1.5Z"/></svg>`;
  },

  linkIcon() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px;flex-shrink:0;"><path d="M3.914,11.545c.527,.639,.437,1.584-.202,2.111-.638,.528-1.584,.438-2.112-.201-1.032-1.25-1.601-2.832-1.601-4.455C0,5.141,3.14,2,7,2h4c3.86,0,7,3.141,7,7,0,3.118-2.094,5.888-5.091,6.736-.137,.039-.274,.057-.41,.057-.654,0-1.255-.431-1.442-1.092-.226-.797,.238-1.626,1.035-1.852,1.713-.484,2.909-2.067,2.909-3.85,0-2.206-1.794-4-4-4H7c-2.206,0-4,1.794-4,4,0,.941,.316,1.821,.914,2.545Zm18.485-1c-.528-.639-1.473-.729-2.112-.201-.639,.527-.729,1.473-.202,2.111,.598,.724,.914,1.604,.914,2.545,0,2.206-1.794,4-4,4h-4c-2.206,0-4-1.794-4-4,0-1.782,1.196-3.365,2.909-3.85,.797-.226,1.26-1.055,1.035-1.852-.226-.798-1.054-1.261-1.852-1.035-2.998,.849-5.091,3.618-5.091,6.736,0,3.859,3.14,7,7,7h4c3.86,0,7-3.141,7-7,0-1.623-.568-3.205-1.601-4.455Z"/></svg>`;
  },

  // ── withToast(supabasePromise, errorMessage) ──────────────────────────────
  // Wraps any Supabase call. On error: shows a toast, logs to console,
  // returns null. On success: returns result.data (or full result if no .data).
  //
  // Previously: each page had its own error handling pattern — some toasted,
  // some console.error'd, most silently dropped errors by destructuring
  // only { data } with no error check at all.
  //
  // Usage:
  //   var posts = await TobUtils.withToast(
  //     supabase.from('posts').select('*'),
  //     'Could not load posts.'
  //   );
  //   if (!posts) return; // error already surfaced to user
  async withToast(supabasePromise, errorMessage) {
    var result = await supabasePromise;
    if (result.error) {
      this.showToast(errorMessage || 'Something went wrong. Please try again.');
      console.error('[withToast]', result.error);
      return null;
    }
    return result.data !== undefined ? result.data : result;
  },

  // ── showState(stateId, map) ───────────────────────────────────────────────
  // Shows one named element and hides all others in the map.
  //
  // Previously: search.js had a local showState(), feed.js had separate
  // showLoader/showEmpty helpers, profile/user had inline display toggles
  // scattered through the code. Now one canonical helper does all of it.
  //
  // Usage:
  //   TobUtils.showState('loader', {
  //     loader:  document.getElementById('feed-loader'),
  //     empty:   document.getElementById('feed-empty'),
  //     results: document.getElementById('feed-posts'),
  //   });
  showState(stateId, map) {
    Object.keys(map).forEach(function (key) {
      var el = map[key];
      if (!el) return;
      el.style.display = key === stateId ? '' : 'none';
    });
  },

};
