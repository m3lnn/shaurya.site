// The nav bar is `position: sticky; top: 0`. A zero-height sentinel placed
// right before it in the flow scrolls away the instant the nav takes over
// the sticky position -- watching the sentinel (rather than the nav itself)
// is the standard, layout-independent way to detect "is this sticky element
// currently pinned". Toggles a class; the actual line-in fade is a CSS
// transition on .navigation, so this only ever flips a boolean.
(function () {
  const nav = document.querySelector('.navigation');
  const sentinel = document.getElementById('navSentinel');
  if (!nav || !sentinel) return;

  const observer = new IntersectionObserver(
    ([entry]) => nav.classList.toggle('is-stuck', !entry.isIntersecting),
    { threshold: 0 }
  );
  observer.observe(sentinel);
})();
