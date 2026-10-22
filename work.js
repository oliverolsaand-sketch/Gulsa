/* Selected Projects cards
 *
 * Each card wipes open once, the first time it comes into view.
 */
(function () {
  'use strict';
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));
  if (!cards.length) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduce || !('IntersectionObserver' in window)) {
    cards.forEach(function (c) { c.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        // one-way: once a card has wiped open it stays open
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.18 });
    cards.forEach(function (c) { io.observe(c); });

    // The cards start fully clipped, so anything that stops the observer from
    // running would leave them permanently invisible. Browsers freeze observer
    // callbacks while a tab is hidden, so re-check on the way back, and keep a
    // hard deadline as the last resort — the work never stays hidden.
    var reveal = function () {
      cards.forEach(function (c) {
        var r = c.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) { c.classList.add('is-in'); io.unobserve(c); }
      });
    };
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) reveal();
    });
    setTimeout(function () {
      cards.forEach(function (c) { c.classList.add('is-in'); io.unobserve(c); });
    }, 4000);
  }

})();
