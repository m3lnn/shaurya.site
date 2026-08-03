document.addEventListener('DOMContentLoaded', () => {
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;

  const TRANSITION_MS = 600;
  const FADE_OUT_MS = 450;

  function contentChildren() {
    return Array.from(mainContent.children).filter(child => !child.classList.contains('navigation'));
  }

  function hideContent() {
    contentChildren().forEach(child => { child.style.display = 'none'; });
  }

  function fadeOutContent() {
    contentChildren().forEach(child => { child.classList.add('page-leaving'); });
  }

  // Mirrors the .reveal > * stagger used for on-load content, just driven
  // from JS so it can be applied to whatever a given page's top-level
  // content happens to be, not just the homepage's hero markup.
  function fadeInContent() {
    contentChildren().forEach((child, i) => {
      child.style.animation = 'fadeInUp 520ms cubic-bezier(0.2, 0, 0, 1) forwards';
      child.style.animationDelay = `${Math.min(i, 4) * 90 + 60}ms`;
    });
  }

  // Arrived here via a settled navigation (collapsing out of the expanded
  // layout, or jumping between two normal-layout pages): the header was
  // clamped to wherever the previous page left it before first paint (see
  // baseof.html), so it wouldn't jump. Ease it open/shut to this page's own
  // real height now, measured live so it works no matter how tall either
  // page's header is.
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

    const startHeight = header.getBoundingClientRect().height;
    header.style.maxHeight = startHeight + 'px';
    header.style.transition = `max-height ${TRANSITION_MS}ms ease`;

    // A single rAF isn't reliable here -- the browser can still coalesce the
    // startHeight write with the next one before ever painting it, skipping
    // the transition entirely. Forcing layout and waiting two frames
    // guarantees the start state is actually committed first.
    let settled = false;
    header.offsetHeight;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // A backgrounded/throttled tab can delay this past the cleanup
        // below -- skip it rather than re-apply a now-stale height.
        if (settled) return;
        header.style.maxHeight = targetHeight + 'px';
      });
    });

    setTimeout(() => {
      settled = true;
      header.style.maxHeight = '';
      header.style.transition = '';
      html.classList.remove('is-settling');
      html.style.removeProperty('--settle-start-height');
    }, TRANSITION_MS);
  }

  // Companion to settleHeaderIfNeeded(): fades this page's own content in
  // (only set when leaving via transitionWithinA -- collapsing out of the
  // expanded layout doesn't need it, since that content is already visible).
  function revealContentIfNeeded() {
    const html = document.documentElement;
    if (!html.classList.contains('is-page-fading')) return;
    fadeInContent();
    setTimeout(() => {
      html.classList.remove('is-page-fading');
      contentChildren().forEach(child => {
        child.style.animation = '';
        child.style.animationDelay = '';
      });
    }, TRANSITION_MS);
  }

  settleHeaderIfNeeded();
  revealContentIfNeeded();

  function navigateAfter(href, delay) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      window.location.href = href;
    }, delay);
  }

  // Layout A -> layout B: slide the card up by exactly the current page's
  // header height so it covers the header, whatever that height is.
  function expandTo(href) {
    const header = document.querySelector('.header-content');
    const shift = header ? header.getBoundingClientRect().height : 0;

    hideContent();
    mainContent.style.setProperty('--expand-shift', `-${shift}px`);
    mainContent.classList.add('expanded');
    navigateAfter(href, TRANSITION_MS);
  }

  // Layout B -> anywhere: layout B has no header, so the destination grows
  // its own header open from 0 (see settleHeaderIfNeeded).
  function collapseTo(href) {
    hideContent();
    mainContent.classList.remove('default-expanded');
    sessionStorage.setItem('siteSettle', '0');
    navigateAfter(href, TRANSITION_MS);
  }

  // Layout A -> layout A: both pages have a header, possibly at different
  // heights, and both have their own content. Fade this page's content out,
  // tell the destination exactly where this page's header currently sits,
  // and let it ease open/shut to its own real height while its content
  // fades in behind it.
  function transitionWithinA(href) {
    const header = document.querySelector('.header-content');
    const fromHeight = header ? header.getBoundingClientRect().height : 0;

    fadeOutContent();
    sessionStorage.setItem('siteSettle', String(Math.round(fromHeight)));
    sessionStorage.setItem('sitePageFade', '1');
    navigateAfter(href, FADE_OUT_MS);
  }

  document.querySelectorAll('.navigation a').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const href = link.href;

      if (mainContent.classList.contains('default-expanded')) {
        collapseTo(href);
      } else if (link.hasAttribute('data-expand')) {
        expandTo(href);
      } else {
        transitionWithinA(href);
      }
    });
  });
});
