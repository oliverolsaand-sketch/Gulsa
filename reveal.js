/* Fade-in-on-scroll
 *
 * One-way: once an element has arrived it stays put.
 */
(function () {
  'use strict';
  var els = Array.prototype.slice.call(document.querySelectorAll('.reveal-up'));
  if (!els.length) return;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('is-in'); });
    return;
  }
  var groups = new Map();
  els.forEach(function (el) {
    var parent = el.parentElement;
    var i = groups.has(parent) ? groups.get(parent) : 0;
    el.style.transitionDelay = Math.min(i, 4) * 0.09 + 's';
    groups.set(parent, i + 1);
  });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.01, rootMargin: '0px 0px 0px 0px' });
  els.forEach(function (el) { io.observe(el); });
})();
