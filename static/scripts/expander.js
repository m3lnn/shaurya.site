document.addEventListener('DOMContentLoaded', () => {
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;

  const TRANSITION_MS = 600;

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
