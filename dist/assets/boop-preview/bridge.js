// Keep the source renderer intact; tell the landing page about visitor gestures.
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches && !window.slimePreview.getState().paused) {
    document.querySelector('[data-pause]').click();
  }
  const canvas = document.querySelector('.slime-stage');
  let contact = null;
  canvas.addEventListener('pointerdown', event => {
    if (window.slimePreview.getState().grab.active) {
      contact = {id:event.pointerId, x:event.clientX, y:event.clientY, started:performance.now()};
    }
  });
  function finish(event) {
    if (!contact || contact.id !== event.pointerId) return;
    const moved = Math.hypot(event.clientX-contact.x, event.clientY-contact.y);
    const kind = moved > 8 ? 'drag' : performance.now()-contact.started > 500 ? 'hold' : 'tap';
    contact = null;
    try { parent.document.dispatchEvent(new CustomEvent('boop-interaction', {detail:{kind}})); } catch {}
  }
  canvas.addEventListener('pointerup', finish);
  canvas.addEventListener('pointercancel', () => { contact=null; });
})();
