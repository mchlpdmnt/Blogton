// ── Mailto form handler ──
  history.replaceState(null, '', '/contact');
    document.getElementById('cf-submit').addEventListener('click', () => {
      const name    = document.getElementById('cf-name').value.trim();
      const email   = document.getElementById('cf-email').value.trim();
      const subject = document.getElementById('cf-subject').value;
      const message = document.getElementById('cf-message').value.trim();

      if (!name || !email || !message) {
        // Simple inline validation
        if (!name)    document.getElementById('cf-name').focus();
        else if (!email)    document.getElementById('cf-email').focus();
        else if (!message)  document.getElementById('cf-message').focus();
        return;
      }

      const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;
      const mailto = `mailto:mchlpdmnt@gmail.com`
        + `?subject=${encodeURIComponent(`[Blogton] ${subject}`)}`
        + `&body=${encodeURIComponent(body)}`;

      window.location.href = mailto;

      // Show success note
      document.getElementById('cf-success').classList.add('visible');
    });
