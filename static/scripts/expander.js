document.addEventListener('DOMContentLoaded', () => {
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;

  const TRANSITION_MS = 600;

  // Arrived here via a collapse from the expanded layout: the header was
  // clamped to 0 height before first paint (see baseof.html) so the card
  // would start flush with the top, matching where the collapse left it.
  // Grow the header back open now, measured from its own real content so
  // this works no matter how tall any given page's header is.
  function settleHeaderIfNeeded() {
    const html = document.documentElement;
    if (!html.classList.contains('is-settling')) return;
    const header = document.querySelector('.header-content');
    if (!header) {
      html.classList.remove('is-settling');
      return;
    }

    // Briefly lift the clamp to read the header's true natural height (with
    // its real min-height back in play), then re-clamp before the browser
    // gets a chance to paint -- this is all synchronous, so nothing flashes.
    html.classList.remove('is-settling');
    const targetHeight = header.scrollHeight;
    html.classList.add('is-settling');

    header.style.maxHeight = '0px';
    header.style.transition = `max-height ${TRANSITION_MS}ms ease`;

    // A single rAF isn't reliable here -- the browser can still coalesce the
    // 0px write with the next one before ever painting it, skipping the
    // transition entirely. Forcing layout and waiting two frames guarantees
    // the 0px state is actually committed first.
    header.offsetHeight;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        header.style.maxHeight = targetHeight + 'px';
      });
    });

    setTimeout(() => {
      header.style.maxHeight = '';
      header.style.transition = '';
      html.classList.remove('is-settling');
    }, TRANSITION_MS);
  }

  settleHeaderIfNeeded();

  function hideContent() {
    Array.from(mainContent.children).forEach(child => {
      if (!child.classList.contains('navigation')) {
        child.style.display = 'none';
      }
    });
  }

  function navigateAfter(href) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      window.location.href = href;
    }, TRANSITION_MS);
  }

  // Layout A -> layout B: slide the card up by exactly the current page's
  // header height so it covers the header, whatever that height is.
  function expandTo(href) {
    const header = document.querySelector('.header-content');
    const shift = header ? header.getBoundingClientRect().height : 0;

    hideContent();
    mainContent.style.setProperty('--expand-shift', `-${shift}px`);
    mainContent.classList.add('expanded');
    navigateAfter(href);
  }

  // Layout B -> anywhere: layout B has no header to reveal, so just shrink
  // the full-bleed card back down to its resting card shape.
  function collapseTo(href) {
    hideContent();
    mainContent.classList.remove('default-expanded');
    sessionStorage.setItem('siteSettle', '1');
    navigateAfter(href);
  }

  document.querySelectorAll('.navigation a[data-expand]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const href = link.href;

      if (mainContent.classList.contains('default-expanded')) {
        collapseTo(href);
      } else {
        expandTo(href);
      }
    });
  });
});
