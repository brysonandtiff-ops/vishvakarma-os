(() => {
  let dismissed = false;

  const dismissBootSplash = () => {
    if (dismissed) return;
    const splash = document.getElementById('boot-splash');
    if (!splash) return;

    dismissed = true;
    splash.style.opacity = '0';
    window.setTimeout(() => splash.remove(), 220);
  };

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      () => window.requestAnimationFrame(dismissBootSplash),
      { once: true },
    );
  } else {
    window.requestAnimationFrame(dismissBootSplash);
  }

  // Fail safe: never leave the app visually covered by a slow resource.
  window.setTimeout(dismissBootSplash, 1500);
})();
