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
    const btn = e.target.closest('button[aria-label="More actions"]');
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = 'https://portal.aibams.com';
    }
  }, true); // capturing phase to intercept before React event delegation triggers
}

// 3. Smooth scrolling for TOC/Anchor links
function setupSmoothScrolling() {
  window.addEventListener('click', (e) => {
    // Find closest anchor tag that points to an ID on the same page
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (href === '#' || href === '#top') return;

    try {
      const targetId = decodeURIComponent(href.slice(1));
      const target = document.getElementById(targetId);
      if (target) {
        // Only intercept if the target element is a heading or inside the article/main content/TOC
        const isContentAnchor = target.closest('article, main, .prose, aside, #table-of-contents') || target.tagName.match(/^H[1-6]$/);
        if (!isContentAnchor) return;

        e.preventDefault();
        e.stopPropagation();

        // Scroll the element into view smoothly
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

        // Update URL hash without causing a page jump
        if (history.pushState) {
          history.pushState(null, null, href);
        } else {
          window.location.hash = href;
        }
      }
    } catch (err) {
      console.warn('Smooth scroll failed for anchor:', href, err);
    }
  }, true); // Use capture phase to intercept before React/Next.js router click handlers
}

// 4. Remove AI Assistant UI components and features cleanly
function setupAIAssistantRemover() {
  const assistantSelectors = [
    '#navbar button:not(#search-bar-entry):not(#search-bar-entry-mobile):not(.group.p-2):not(.focus\:outline-0):not([aria-label="More actions"]):not([aria-label*="navigation"]):not([aria-label*="menu"])',
    'div:has(> [placeholder*="question"])',
    'div:has(> [placeholder*="Ask"])',
    'div:has(> div > [placeholder*="question"])',
    'div:has(> div > [placeholder*="Ask"])',
    'div:has(> textarea):has(button)'
  ];

  let removerObserver;

  function cleanDOM() {
    if (removerObserver) removerObserver.disconnect();

    try {
      // 1. Remove elements matches standard selectors
      assistantSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => el.remove());
        } catch (e) { }
      });

      // 2. Scan inputs/textareas to remove the AI boxes based on placeholder values
      const inputs = document.querySelectorAll('input, textarea');
      inputs.forEach(input => {
        const placeholder = input.getAttribute('placeholder') || '';
        if (placeholder.toLowerCase().includes('ask a question') || placeholder.toLowerCase().includes('ask assistant')) {
          const container = input.closest('div.relative') || input.parentElement;
          if (container) container.remove();
        }
      });

      // 3. Remove AI Assistant options and prompts from the search dialog
      const searchDialog = document.querySelector('div[role="dialog"], [class*="headlessui-dialog"]');
      if (searchDialog) {
        const elements = searchDialog.querySelectorAll('li, a, button, [role="option"]');
        elements.forEach(item => {
          const text = item.textContent.toLowerCase();
          if (
            text.includes('ask assistant') ||
            text.includes('can you tell me about') ||
            text.includes('ask the ai') ||
            text.includes('ask ai')
          ) {
            const container = item.closest('li, [role="option"]') || item;
            if (container) {
              container.style.setProperty('display', 'none', 'important');
              container.style.setProperty('height', '0px', 'important');
              container.style.setProperty('padding', '0px', 'important');
              container.style.setProperty('margin', '0px', 'important');
              container.style.setProperty('border', 'none', 'important');
              container.style.setProperty('overflow', 'hidden', 'important');
            }
          }
        });
      }

      // 4. Close or remove any open AI Assistant dialogues/drawers
      const dialogs = document.querySelectorAll('div[role="dialog"], [class*="headlessui-dialog"]');
      dialogs.forEach(dialog => {
        // Exclude search dialog from removal by checking for any search input
        const searchInput = dialog.querySelector('input');
        const isSearchDialog = searchInput && (
          searchInput.getAttribute('type') === 'search' ||
          (searchInput.getAttribute('placeholder') || '').toLowerCase().includes('search') ||
          (searchInput.getAttribute('id') || '').toLowerCase().includes('search') ||
          (searchInput.getAttribute('class') || '').toLowerCase().includes('search')
        );

        // Exclude the mobile navigation drawer/menu from removal
        const isMobileNav = dialog.querySelector('nav') || dialog.querySelector('#mobile-nav') || dialog.id === 'mobile-nav';

        if (dialog.textContent.includes('Assistant') && !isSearchDialog && !isMobileNav) {
          dialog.remove();
        }
      });

      // 5. Replace space-x-6 with space-x-0 on the header navigation list to bring icons closer
      const headerLists = document.querySelectorAll('#navbar ul.space-x-6');
      headerLists.forEach(ul => {
        ul.classList.remove('space-x-6');
        ul.classList.add('space-x-0');
      });

      // 6. Cleanly remove the AI assistant input container, but spare the search modal
      const inputContainers = document.querySelectorAll('div.rounded-2xl.pointer-events-auto.backdrop-blur-xl');
      inputContainers.forEach(container => {
        const hasSearch = container.querySelector('input[type="search"]') || container.querySelector('[placeholder*="Search"]');
        if (!hasSearch) {
          container.remove();
        }
      });
    } catch (err) {
      console.warn('cleanDOM failed:', err);
    }

    if (removerObserver) {
      removerObserver.observe(document.body, { childList: true, subtree: true });
    }
  }

  // Initial run
  cleanDOM();

  // Watch for dynamic rendering, ignoring modifications inside video players
  removerObserver = new MutationObserver((mutations) => {
    const hasExternalMutation = mutations.some(mutation => {
      const target = mutation.target;
      if (target && target.closest && target.closest('.custom-video-player')) {
        return false;
      }
      return true;
    });
    if (hasExternalMutation) {
      cleanDOM();
    }
  });
  removerObserver.observe(document.body, { childList: true, subtree: true });

  // Intercept keydown on the search bar to block "Enter" key triggering the AI Assistant
  window.addEventListener('keydown', (e) => {
    const activeEl = document.activeElement;
    if (activeEl && activeEl.tagName === 'INPUT' && activeEl.getAttribute('type') === 'search') {
      if (e.key === 'Enter') {
        const results = Array.from(document.querySelectorAll('[role="option"], a[href^="/"]'));
        const activeResult = document.querySelector('[aria-selected="true"], [class*="selected"], [class*="active-item"]');

        if (activeResult) {
          const text = activeResult.textContent.toLowerCase();
          if (text.includes('ask') || text.includes('assistant') || text.includes('ai')) {
            e.preventDefault();
            e.stopPropagation();

            // Redirect to first non-AI result
            const firstRealResult = results.find(r => {
              const rText = r.textContent.toLowerCase();
              return !rText.includes('ask') && !rText.includes('assistant') && !rText.includes('ai');
            });
            if (firstRealResult) {
              firstRealResult.click();
            }
          }
        } else {
          // If nothing is selected, click the first real result instead of submitting to AI
          e.preventDefault();
          e.stopPropagation();
          const firstRealResult = results.find(r => {
            const rText = r.textContent.toLowerCase();
            return !rText.includes('ask') && !rText.includes('assistant') && !rText.includes('ai');
          });
          if (firstRealResult) {
            firstRealResult.click();
          }
        }
      }
    }
  }, true);
}

// 5. Intercept Search network API requests (Fetch & XHR) to filter out AI/Assistant data at the source
function setupSearchInterceptor() {
  // A. Fetch Interceptor
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const url = args[0];
    if (typeof url === 'string' && (url.includes('/search') || url.includes('mintlify.com/api/search') || url.includes('/assistant'))) {
      try {
        const response = await originalFetch.apply(this, args);
        const clonedResponse = response.clone();
        let data = await clonedResponse.json();

        if (Array.isArray(data)) {
          data = data.filter(item => {
            const title = (item.title || item.name || '').toLowerCase();
            const text = (item.text || item.content || '').toLowerCase();
            const type = (item.type || '').toLowerCase();
            return !title.includes('ask assistant') &&
              !title.includes('ask ai') &&
              !text.includes('can you tell me about') &&
              type !== 'assistant' &&
              type !== 'ai';
          });
        } else if (data && typeof data === 'object') {
          delete data.suggestion;
          delete data.suggestions;
          delete data.conversationId;
          delete data.assistant;
          if (Array.isArray(data.results)) {
            data.results = data.results.filter(item => {
              const title = (item.title || item.name || '').toLowerCase();
              const text = (item.text || item.content || '').toLowerCase();
              return !title.includes('ask assistant') &&
                !title.includes('ask ai') &&
                !text.includes('can you tell me about');
            });
          }
          if (Array.isArray(data.hits)) {
            data.hits = data.hits.filter(item => {
              const title = (item.title || item.name || '').toLowerCase();
              const text = (item.text || item.content || '').toLowerCase();
              return !title.includes('ask assistant') &&
                !title.includes('ask ai') &&
                !text.includes('can you tell me about');
            });
          }
        }

        return new Response(JSON.stringify(data), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      } catch (err) {
        console.warn('Fetch search interceptor failed:', err);
      }
    }
    return originalFetch.apply(this, args);
  };

  // B. XMLHttpRequest Interceptor
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url, ...args) {
    if (typeof url === 'string' && (url.includes('/search') || url.includes('mintlify.com/api/search') || url.includes('/assistant'))) {
      this.addEventListener('readystatechange', function () {
        if (this.readyState === 4 && this.status === 200) {
          try {
            let data = JSON.parse(this.responseText);
            if (Array.isArray(data)) {
              data = data.filter(item => {
                const title = (item.title || item.name || '').toLowerCase();
                const type = (item.type || '').toLowerCase();
                return !title.includes('ask assistant') && !title.includes('ask ai') && type !== 'assistant';
              });
            } else if (data && typeof data === 'object') {
              delete data.suggestion;
              delete data.suggestions;
              delete data.conversationId;
              delete data.assistant;
              if (Array.isArray(data.results)) {
                data.results = data.results.filter(item => {
                  const title = (item.title || item.name || '').toLowerCase();
                  return !title.includes('ask assistant') && !title.includes('ask ai');
                });
              }
            }
            Object.defineProperty(this, 'responseText', { writable: true, value: JSON.stringify(data) });
            Object.defineProperty(this, 'response', { writable: true, value: JSON.stringify(data) });
          } catch (e) { }
        }
      });
    }
    return originalOpen.apply(this, [method, url, ...args]);
  };
}

// Initialize scripts depending on document loading state
if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => {
    setupSearchInterceptor();
    updateFavicon();
    new MutationObserver(updateFavicon).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    setupMobileMenuRedirect();
    setupSmoothScrolling();
    setupAIAssistantRemover();
    setupCustomVideoPlayers();
    setupFeedbackSection();
  });
} else {
  setupSearchInterceptor();
  updateFavicon();
  new MutationObserver(updateFavicon).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  setupMobileMenuRedirect();
  setupSmoothScrolling();
  setupAIAssistantRemover();
  setupCustomVideoPlayers();
  setupFeedbackSection();
}

// 6. Custom Video Player Initialization
function setupCustomVideoPlayers() {
  console.log("Custom Video Player setup initialized");

  let observer;

  // Format time helper: returns "MM:SS"
  function formatTime(seconds) {
    if (isNaN(seconds) || seconds === Infinity) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Find videos and attach controls dynamically
  function applyControlsToVideos() {
    if (observer) {
      observer.disconnect();
    }

    try {
      const videos = document.querySelectorAll('video');
      videos.forEach(video => {
        // Skip if already setup
        if (video.dataset.customControlsSetup === 'true') return;
        video.dataset.customControlsSetup = 'true';

        console.log("Processing video controls for:", video.src || video.getAttribute('src'));

        // Hide browser controls
        video.removeAttribute('controls');
        video.controls = false;
        video.classList.add('custom-video');

        // Wrap the video in a .custom-video-player div if it isn't already inside one
        let wrapper = video.parentElement;
        if (!wrapper || !wrapper.classList.contains('custom-video-player')) {
          wrapper = document.createElement('div');
          wrapper.className = 'custom-video-player';
          video.parentNode.insertBefore(wrapper, video);
          wrapper.appendChild(video);
        }

        // Build controls overlay
        const controls = document.createElement('div');
        controls.className = 'video-overlay-controls';

        const playBtn = document.createElement('button');
        playBtn.className = 'play-btn';
        playBtn.innerHTML = video.paused ? "▶" : "⏸";
        controls.appendChild(playBtn);

        const progress = document.createElement('input');
        progress.type = 'range';
        progress.className = 'progress-bar';
        progress.min = '0';
        progress.max = '100';
        progress.value = '0';
        controls.appendChild(progress);

        const timer = document.createElement('span');
        timer.className = 'video-timer';
        timer.textContent = '00:00 / 00:00';
        controls.appendChild(timer);

        wrapper.appendChild(controls);

        // Sync helper for this specific video
        function syncState() {
          playBtn.innerHTML = video.paused ? "▶" : "⏸";
          timer.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
          if (video.duration) {
            progress.value = ((video.currentTime / video.duration) * 100).toString();
          }
        }

        // Attach listeners for this video
        video.addEventListener('timeupdate', syncState);
        video.addEventListener('loadedmetadata', syncState);
        video.addEventListener('play', syncState);
        video.addEventListener('pause', syncState);

        // Play/Pause button click
        playBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (video.paused) {
            video.play().catch(err => console.error("Play failed:", err));
          } else {
            video.pause();
          }
        });

        // Video element click
        video.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (video.paused) {
            video.play().catch(err => console.error("Play failed:", err));
          } else {
            video.pause();
          }
        });

        // Progress bar seeking
        progress.addEventListener('input', (e) => {
          e.stopPropagation();
          if (video.duration) {
            const seekTime = (parseFloat(progress.value) / 100) * video.duration;
            video.currentTime = seekTime;
          }
        });

        // Initial sync
        syncState();
      });
    } catch (err) {
      console.warn('Sync custom video states failed:', err);
    }

    if (observer) {
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  // Watch DOM additions/navigation to apply controls to new videos
  observer = new MutationObserver((mutations) => {
    let hasNewVideo = false;
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName === 'VIDEO' || node.querySelector('video')) {
            hasNewVideo = true;
          }
        }
      });
    });
    if (hasNewVideo) {
      applyControlsToVideos();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Initial Sync
  applyControlsToVideos();
}

// 7. Dynamic Feedback Section Setup
function setupFeedbackSection() {
  console.log("Feedback Section setup initialized");

  let feedbackObserver;

  function injectFeedback() {
    if (feedbackObserver) {
      feedbackObserver.disconnect();
    }

    try {
      const footer = document.querySelector('footer');
      if (!footer) return;

      // Check if feedback section is already present
      if (document.querySelector('.custom-feedback-section')) return;

      const pagePath = window.location.pathname;
      const voteKey = `feedback_vote_${pagePath}`;
      const hasVoted = localStorage.getItem(voteKey) || sessionStorage.getItem(voteKey);

      const feedbackSection = document.createElement('div');
      feedbackSection.className = 'custom-feedback-section';

      const feedbackContent = document.createElement('div');
      feedbackContent.className = 'feedback-content';

      const question = document.createElement('span');
      question.className = 'feedback-question';
      question.textContent = 'Was this page helpful?';
      feedbackContent.appendChild(question);

      const buttonsContainer = document.createElement('div');
      buttonsContainer.className = 'feedback-buttons';

      const thumbsUp = document.createElement('button');
      thumbsUp.className = 'feedback-btn btn-yes';
      thumbsUp.setAttribute('aria-label', 'Helpful');
      thumbsUp.innerHTML = '<svg class="feedback-icon" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>';

      const thumbsDown = document.createElement('button');
      thumbsDown.className = 'feedback-btn btn-no';
      thumbsDown.setAttribute('aria-label', 'Not Helpful');
      thumbsDown.innerHTML = '<svg class="feedback-icon" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="1" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>';

      buttonsContainer.appendChild(thumbsUp);
      buttonsContainer.appendChild(thumbsDown);
      feedbackContent.appendChild(buttonsContainer);

      const thanksText = document.createElement('span');
      thanksText.className = 'feedback-thanks hidden';
      thanksText.textContent = 'Thanks for your feedback!';
      feedbackContent.appendChild(thanksText);

      feedbackSection.appendChild(feedbackContent);

      // Insert before the footer element inside its parent
      footer.parentNode.insertBefore(feedbackSection, footer);

      // Helper function to handle vote submission
      function handleVote(voteType) {
        localStorage.setItem(voteKey, voteType);
        sessionStorage.setItem(voteKey, voteType);

        // Hide question and buttons
        question.style.display = 'none';
        buttonsContainer.style.display = 'none';

        // Show thanks message
        thanksText.classList.remove('hidden');

        // Revert back to original state after 2 seconds
        setTimeout(() => {
          thanksText.classList.add('hidden');
          question.style.display = '';
          buttonsContainer.style.display = '';
        }, 2000);
      }

      // Bind vote events
      thumbsUp.addEventListener('click', () => handleVote('yes'));
      thumbsDown.addEventListener('click', () => handleVote('no'));
    } catch (err) {
      console.warn('Feedback injection failed:', err);
    }

    if (feedbackObserver) {
      feedbackObserver.observe(document.body, { childList: true, subtree: true });
    }
  }

  // Watch DOM additions/navigation to apply controls to new pages
  feedbackObserver = new MutationObserver((mutations) => {
    let shouldCheck = false;
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName === 'ARTICLE' || node.querySelector('article') || node.querySelector('footer')) {
            shouldCheck = true;
          }
        }
      });
    });
    if (shouldCheck) {
      injectFeedback();
    }
  });

  feedbackObserver.observe(document.body, { childList: true, subtree: true });

  // Initial Run
  injectFeedback();
}

