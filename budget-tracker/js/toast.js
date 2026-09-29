/**
 * Small notification at the bottom of the screen, with an optional action button (like Undo).
 */
(function (BT) {
  'use strict';

  const { $ } = BT.utils;
  let timer = null;

  function hide() {
    clearTimeout(timer);
    $('toastWrap').hidden = true;
  }

  function show(message, action) {
    clearTimeout(timer);
    $('toastMsg').textContent = message;

    const button = $('toastAction');
    if (action) {
      button.textContent = action.label;
      button.hidden = false;
      button.onclick = () => { action.run(); hide(); };
    } else {
      button.hidden = true;
      button.onclick = null;
    }

    $('toastWrap').hidden = false;
    timer = setTimeout(hide, action ? 7000 : 3500);
  }

  BT.toast = { show, hide };
})(window.BT);
