/* Scroll-scrubbed opening sequence
 *
 * Scroll position maps to a frame index and that frame is painted to a canvas.
 * Frames rather than a <video> because video seeking cannot keep up with a
 * scroll wheel -- it stutters and lags behind the cursor.
 */
// The frames are ordinary files, so the browser streams and caches them
// one at a time instead of parsing one enormous document up front.
var HERO_FRAMES = [];
for (var f = 1; f <= 240; f++) {
  HERO_FRAMES.push('assets/hero/' + ('000' + f).slice(-4) + '.jpg');
}


(function () {
  'use strict';
  var stage = document.getElementById('stage');
  var canvas = document.getElementById('seq');
  var track = document.getElementById('track');
  var loader = document.getElementById('loader');
  var loaderBar = document.getElementById('loaderBar');
  var loaderPct = document.getElementById('loaderPct');

  var ctx = canvas.getContext('2d', { alpha: false });
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var images = [];
  var frameCount = HERO_FRAMES.length;
  var loadedCount = 0;
  var targetFrame = 0, currentFrame = 0, lastPainted = -1, ready = false;
  var progress = 0;

  function sizeCanvas() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = stage.clientWidth, h = stage.clientHeight;
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
    for (var r = 1; r < frameCount; r++) {
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
    progress = clamp(-rect.top / scrollable, 0, 1);
    targetFrame = progress * (frameCount - 1);
    // Snap instead of easing right at the very end: a scroll that's still
    // fast right as the pin releases would hand off to whatever frame the
    // lerp happened to have caught up to, not necessarily the true last
    // frame the headline settles over.
    if (progress <= 0 || progress >= 1) currentFrame = targetFrame;
    var hint = document.getElementById('scrollHint');
    if (hint) hint.style.opacity = progress > 0.015 ? '0' : '1';
  }

  function tick() {
    if (reduceMotion) { currentFrame = targetFrame; }
    else {
      currentFrame += (targetFrame - currentFrame) * 0.18;
      if (Math.abs(targetFrame - currentFrame) < 0.01) currentFrame = targetFrame;
    }
    var idx = Math.round(currentFrame);
    if (idx !== lastPainted) { var p = paintNearest(idx); if (p !== -1) lastPainted = idx; }
    requestAnimationFrame(tick);
  }

  function loadFrame(i) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.decoding = 'async';
      img.onload = function () { images[i] = img; loadedCount++; onProgress(); resolve(); };
      img.onerror = function () { loadedCount++; onProgress(); resolve(); };
      img.src = HERO_FRAMES[i];
    });
  }
  function onProgress() {
    var pct = Math.round((loadedCount / frameCount) * 100);
    if (loaderBar) loaderBar.style.transform = 'scaleX(' + (loadedCount / frameCount) + ')';
    if (loaderPct) loaderPct.textContent = pct + '%';
    if (!ready && loadedCount >= Math.min(24, frameCount)) {
      ready = true;
      document.body.classList.add('is-ready');
      if (loader) setTimeout(function () { loader.classList.add('is-gone'); }, 400);
    }
  }
  function loadAll() {
    var next = 0, CONCURRENCY = 6;
    function pump() {
      if (next >= frameCount) return Promise.resolve();
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
  var SCRUB_DISTANCE = isMobile ? 1120 : 1440;
  track.style.height = (SCRUB_DISTANCE + window.innerHeight) + 'px';

  sizeCanvas();
  window.addEventListener('resize', function () { sizeCanvas(); updateTarget(); }, { passive: true });
  window.addEventListener('scroll', updateTarget, { passive: true });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) return;
    updateTarget(); currentFrame = targetFrame; lastPainted = -1;
  });

  updateTarget(); currentFrame = targetFrame;
  loadAll();
  requestAnimationFrame(tick);
})();
