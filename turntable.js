/* Second pinned sequence: the character turntable
 *
 * Same scroll-to-frame approach as hero.js, with its own track and a fixed
 * frame count.
 */
// The frames are ordinary files, so the browser streams and caches them
// one at a time instead of parsing one enormous document up front.
var TURN_FRAMES = [];
for (var f = 1; f <= 121; f++) {
  TURN_FRAMES.push('assets/turntable/' + ('000' + f).slice(-4) + '.jpg');
}


(function () {
  'use strict';
  var FRAME_COUNT = TURN_FRAMES.length;
  var figure = document.getElementById('turnFigure');
  var canvas = document.getElementById('turnSeq');
  var track = document.getElementById('turnTrack');
  if (!canvas || !track) return;

  var ctx = canvas.getContext('2d', { alpha: false });
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var images = [], loadedCount = 0, targetFrame = 0, currentFrame = 0, lastPainted = -1;

  function sizeCanvas() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = figure.clientWidth, h = figure.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    // Resizing the backing store resets the context, and these frames are
    // always being scaled to fit the viewport -- so ask for the good
    // resampler again rather than the cheap default.
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    lastPainted = -1;
  }
  function paint(index) {
    var img = images[index];
    if (!img) return false;
    var cw = canvas.width, ch = canvas.height;
    var scale = Math.max(cw / img.width, ch / img.height);
    var dw = img.width * scale, dh = img.height * scale;
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    return true;
  }
  function paintNearest(index) {
    if (paint(index)) return index;
    for (var r = 1; r < FRAME_COUNT; r++) {
      if (paint(index - r)) return index - r;
      if (paint(index + r)) return index + r;
    }
    return -1;
  }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function updateTarget() {
    var rect = track.getBoundingClientRect();
    var scrollable = track.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return;
    var progress = clamp(-rect.top / scrollable, 0, 1);
    targetFrame = progress * (FRAME_COUNT - 1);
  }
  var manifestoLines = Array.prototype.slice.call(document.querySelectorAll('.manifesto-line'));
  var manifestoActiveIndex = -1;
  function updateManifesto() {
    if (!manifestoLines.length) return;
    var p = FRAME_COUNT > 1 ? currentFrame / (FRAME_COUNT - 1) : 0;
    var idx = p <= 0 ? -1 : Math.min(manifestoLines.length - 1, Math.floor(p * manifestoLines.length));
    if (idx === manifestoActiveIndex) return;
    manifestoActiveIndex = idx;
    for (var i = 0; i < manifestoLines.length; i++) {
      manifestoLines[i].classList.toggle('is-lit', i === manifestoActiveIndex);
    }
  }
  function tick() {
    if (reduceMotion) { currentFrame = targetFrame; }
    else {
      currentFrame += (targetFrame - currentFrame) * 0.45;
      if (Math.abs(targetFrame - currentFrame) < 0.01) currentFrame = targetFrame;
    }
    var idx = Math.round(currentFrame);
    if (idx !== lastPainted) { var p = paintNearest(idx); if (p !== -1) lastPainted = idx; }
    updateManifesto();
    requestAnimationFrame(tick);
  }
  function loadFrame(i) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.decoding = 'async';
      img.onload = function () { images[i] = img; loadedCount++; resolve(); };
      img.onerror = function () { loadedCount++; resolve(); };
      img.src = TURN_FRAMES[i];
    });
  }
  function loadAll() {
    var next = 0, CONCURRENCY = 6;
    function pump() {
      if (next >= FRAME_COUNT) return Promise.resolve();
      var i = next++; return loadFrame(i).then(pump);
    }
    var runners = [];
    for (var k = 0; k < CONCURRENCY; k++) runners.push(pump());
    return Promise.all(runners);
  }

  var isMobile = window.matchMedia('(max-width: 767px)').matches;
  // How far you scroll to get through the whole sequence. Deliberately a
  // fixed distance rather than frames x px: the frame count is an encoding
  // decision, and it shouldn't change how long this section feels.
  var SCRUB_DISTANCE = isMobile ? 847 : 1089;
  track.style.height = (SCRUB_DISTANCE + window.innerHeight) + 'px';

  sizeCanvas();
  window.addEventListener('resize', function () { sizeCanvas(); updateTarget(); }, { passive: true });
  window.addEventListener('scroll', updateTarget, { passive: true });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) return;
    updateTarget(); currentFrame = targetFrame; lastPainted = -1;
  });

  updateTarget(); currentFrame = targetFrame;
  requestAnimationFrame(tick);

  function startLoading() {
    if (document.body.classList.contains('is-ready')) { loadAll(); return; }
    setTimeout(startLoading, 150);
  }
  startLoading();
})();
