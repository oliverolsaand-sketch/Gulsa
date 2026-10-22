/* Click-to-copy handles
 *
 * Copies the handle to the clipboard and confirms it on the button itself.
 */
(function () {
  'use strict';
  var buttons = document.querySelectorAll('.contact-tab');
  buttons.forEach(function (btn) {
    var span = btn.querySelector('span');
    var original = span.textContent;
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      if (navigator.clipboard) navigator.clipboard.writeText(text).catch(function () {});
      span.textContent = 'Copied';
      btn.classList.add('is-copied');
      setTimeout(function () {
        span.textContent = original;
        btn.classList.remove('is-copied');
      }, 1200);
    });
  });
})();
