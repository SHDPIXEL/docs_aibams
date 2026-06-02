// AIBAMS Documentation Custom Scripts

// 1. Dynamic Favicon Setup (updates favicon depending on dark/light mode)
function updateFavicon() {
  const isDark = document.documentElement.classList.contains('dark');
  const favicon = document.querySelector('link[rel*="icon"]');
  if (favicon) {
    favicon.href = isDark ? '/logo/icon-w.png' : '/logo/icon-b.png';
  }
}

// 2. Mobile User Icon Redirect
// Capture click event on the Mobile Header User Profile button and redirect to Portal
function setupMobileMenuRedirect() {
  window.addEventListener('click', (e) => {
    const btn = e.target.closest('button[aria-label="More actions"], button.h-7.w-5, [aria-label="More actions"]');
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = 'https://portal.aibams.com';
    }
  }, true); // capturing phase to intercept before React event delegation triggers
}

// Initialize scripts depending on document loading state
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => {
    updateFavicon();
    new MutationObserver(updateFavicon).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    setupMobileMenuRedirect();
  });
} else {
  updateFavicon();
  new MutationObserver(updateFavicon).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  setupMobileMenuRedirect();
}
