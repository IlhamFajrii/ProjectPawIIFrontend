// Cadangan animasi keluar untuk browser tanpa transisi `overlay` dan `display`
// (panduan animate-to-from-top-layer).
let displayTransition: boolean | undefined;

function canTransitionDisplay() {
  if (displayTransition !== undefined) return displayTransition;
  if (!window.CSS?.supports?.('transition-behavior', 'allow-discrete')) return false;
  const probe = document.createElement('div');
  probe.style.cssText = 'transition: display 1s allow-discrete !important; display: block;';
  document.body.appendChild(probe);
  void getComputedStyle(probe).display;
  probe.style.display = 'none';
  displayTransition = getComputedStyle(probe).display === 'block';
  probe.remove();
  return displayTransition;
}

async function animationsDone(element: Element) {
  const animations = element.getAnimations?.({ subtree: true }) ?? [];
  if (animations.length === 0) return;
  await Promise.race([
    Promise.allSettled(animations.map((animation) => animation.finished)),
    new Promise((resolve) => setTimeout(resolve, 1000)),
  ]);
}

/** Menutup dialog dengan animasi keluar, lalu selesai setelah animasinya habis. */
export async function closeDialog(dialog: HTMLDialogElement) {
  const native = Boolean(window.CSS?.supports?.('overlay', 'auto')) && canTransitionDisplay();
  if (!native) {
    dialog.setAttribute('data-closing', '');
    await animationsDone(dialog);
    // Dibuka lagi selagi animasi berjalan.
    if (!dialog.hasAttribute('data-closing')) return false;
    dialog.removeAttribute('data-closing');
  }
  dialog.close();
  if (native) await animationsDone(dialog);
  return !dialog.open;
}
