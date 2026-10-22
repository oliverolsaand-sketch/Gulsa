/* The thumbnail field
 *
 * Thumbnails scatter into place along the scroll while the section is pinned.
 */
var SHEET_SRC = [
  'assets/feed/block-clash-turnaj-live-nahledak.jpg',
  'assets/feed/vyhral-som-minecraft-civilization-event.jpg',
  'assets/feed/drolgo-pfp1.jpg',
  'assets/feed/pvp-king-nahledak-clutch.jpg',
  'assets/feed/dokoncil-som-15-skillov-za-3-hodiny.jpg',
  'assets/feed/mrpepka-banner-4.jpg',
  'assets/feed/dostal-som-sa-do-vazenia-na-hardcore-smp.jpg',
  'assets/feed/guulsiq-pfp-1.jpg',
  'assets/feed/sheltix-nahledak-tutorial-na-davinci.jpg',
  'assets/feed/objavil-som-crazy-editovaci-style-zuby-timeline.jpg',
  'assets/feed/drindo-setup-tour-nahledak.jpg',
  'assets/feed/pandak-pfp.jpg',
  'assets/feed/zabil-som-mafiu-a-stal-som-sa-panom-smp-drwoolf-.jpg',
  'assets/feed/adameantius-huntil-nas-najvacsi-podvodnik-na-har.jpg',
  'assets/feed/ggfx-minecraft-pack-thumbnail-111.jpg',
  'assets/feed/ajhttv-live.jpg',
  'assets/feed/adameantius-ale-svet-sa-kopiruje-final.jpg',
  'assets/feed/fps-challenge-w-bright-nahledak.jpg',
  'assets/feed/adameantius-minecraft-ale-kopiruje-sa-vsetko-co-.jpg',
  'assets/feed/gulsa-zapol-omylom-stream.jpg',
  'assets/feed/ovjavil-som-crazy-editovaci-styl-1.jpg',
  'assets/feed/s1msity-leto-live.jpg',
  'assets/feed/setup-tour-26.jpg',
  'assets/feed/uz-nie-je-nic-ako-predtym-cely-pribeh.jpg'
];
var SHEET_SHAPE = ["wide", "wide", "square", "wide", "wide", "banner", "wide", "square", "wide", "wide", "wide", "square", "wide", "wide", "wide", "wide", "wide", "wide", "wide", "wide", "wide", "wide", "wide", "wide"];

(function () {
  'use strict';
  var section = document.getElementById('sheetSection');
  var stage = document.getElementById('sheetStage');
  var field = document.getElementById('sheetField');
  var hint  = document.getElementById('sheetHint');
  if (!stage || !field) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var total = SHEET_SRC.length;

  // Reduced motion: skip the trail and the pin entirely, lay the set out flat.
  if (reduce) {
    section.classList.add('is-static');
    stage.classList.add('is-static');
    for (var s = 0; s < total; s++) {
      var d = document.createElement('div');
      d.className = 'sheet-item';
      var im = document.createElement('img');
      im.src = SHEET_SRC[s]; im.alt = '';
      d.appendChild(im);
      field.appendChild(d);
    }
    return;
  }

  // A pool bigger than the image set, so a thumb still on screen is never
  // yanked out from under itself to be reused for the next drop.
  var POOL = 30;
  var LIFE = 1500;   // ms fully visible before it starts burning off
  var STEP = 92;     // px of pointer travel between drops

  var pool = [];
  for (var i = 0; i < POOL; i++) {
    var el = document.createElement('div');
    el.className = 'sheet-item';
    var img = document.createElement('img');
    img.alt = ''; img.decoding = 'async';
    el.appendChild(img);
    field.appendChild(el);
    pool.push({ el: el, img: img, timer: 0 });
  }

  // Warm the decoder so the first pass doesn't drop in blank.
  SHEET_SRC.forEach(function (src) { var p = new Image(); p.src = src; });

  var slot = 0, pick = 0, z = 1;
  var lastX = null, lastY = null;

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  function drop(x, y, dx) {
    var s = pool[slot % POOL]; slot++;
    var idx = pick % total; pick++;

    clearTimeout(s.timer);

    s.el.className = 'sheet-item is-' + SHEET_SHAPE[idx];
    s.img.src = SHEET_SRC[idx];

    var w = s.el.offsetWidth, h = s.el.offsetHeight;
    var W = field.clientWidth, H = field.clientHeight;
    var px = clamp(x - w / 2, 4, Math.max(4, W - w - 4));
    var py = clamp(y - h / 2, 4, Math.max(4, H - h - 4));

    // Tilt follows the direction of travel, so the trail reads as motion
    // rather than as randomly scattered confetti.
    var rot = clamp(dx * 0.06, -15, 15);
    var base = 'translate(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px) rotate(' + rot.toFixed(2) + 'deg)';

    s.el.style.zIndex = String(z++);
    s.el.style.transition = 'none';
    s.el.style.opacity = '0';
    s.el.style.transform = base + ' scale(0.78)';
    void s.el.offsetWidth;

    s.el.style.transition = 'transform 0.62s cubic-bezier(0.22,1,0.36,1), opacity 0.32s ease';
    s.el.style.opacity = '1';
    s.el.style.transform = base + ' scale(1)';

    s.timer = setTimeout(function () {
      s.el.style.transition = 'transform 0.85s cubic-bezier(0.4,0,0.2,1), opacity 0.7s ease';
      s.el.style.opacity = '0';
      s.el.style.transform = 'translate(' + px.toFixed(1) + 'px,' + (py - 18).toFixed(1) + 'px) rotate(' + rot.toFixed(2) + 'deg) scale(1.05)';
    }, LIFE);
  }

  function onMove(x, y) {
    stage.classList.add('is-active');
    if (lastX === null) { lastX = x; lastY = y; drop(x, y, 0); return; }
    var dx = x - lastX, dy = y - lastY;
    if (Math.sqrt(dx * dx + dy * dy) < STEP) return;
    lastX = x; lastY = y;
    drop(x, y, dx);
  }

  stage.addEventListener('mousemove', function (e) {
    var r = field.getBoundingClientRect();
    onMove(e.clientX - r.left, e.clientY - r.top);
  }, { passive: true });

  stage.addEventListener('touchmove', function (e) {
    var t = e.touches[0]; if (!t) return;
    var r = field.getBoundingClientRect();
    onMove(t.clientX - r.left, t.clientY - r.top);
  }, { passive: true });

  if (window.matchMedia('(hover: none)').matches && hint) hint.textContent = 'Drag across';
})();
