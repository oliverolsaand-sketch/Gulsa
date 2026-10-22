/* Word-by-word bio reveal
 *
 * Every word's brightness comes from its own distance to a focus line partway
 * down the viewport -- no pinning, no per-word stagger by index.
 */
(function () {
  'use strict';
  var blocks = Array.prototype.slice.call(document.querySelectorAll('.reveal-block'));
  if (!blocks.length) return;
  var words = [];
  blocks.forEach(function (block) {
    var text = block.textContent;
    block.innerHTML = text.split(' ').map(function (word) {
      return '<span class="w">' + word + '</span>';
    }).join(' ');
    words = words.concat(Array.prototype.slice.call(block.querySelectorAll('.w')));
  });
  if (!words.length) return;
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    words.forEach(function (w) { w.style.opacity = '1'; });
    return;
  }
  var FOCUS_Y = 0.6, BAND = 0.22, DIM = 0.18;
  var smoothed = words.map(function () { return DIM; });
  function tick() {
    var vh = window.innerHeight;
    var focusPx = vh * FOCUS_Y;
    var bandPx = vh * BAND;
    words.forEach(function (w, i) {
      var r = w.getBoundingClientRect();
      var cy = r.top + r.height / 2;
      var t = clamp01((focusPx - cy) / bandPx + 0.5);
      var target = DIM + (1 - DIM) * t;
      smoothed[i] += (target - smoothed[i]) * 0.18;
      w.style.opacity = smoothed[i].toFixed(3);
    });
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
