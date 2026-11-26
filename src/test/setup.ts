// jsdom tidak mendukung penuh showModal, popover, matchMedia, dan IntersectionObserver.
// Tiruan ini cukup untuk logika; perilaku popup dan scroll diverifikasi di browser sungguhan.
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

class Observer {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

function matchMedia(query: string): MediaQueryList {
  return {
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  };
}

beforeEach(() => {
  window.matchMedia = matchMedia;
  window.IntersectionObserver = Observer as unknown as typeof IntersectionObserver;
  window.scrollTo = () => {};

  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
  HTMLElement.prototype.showPopover = function showPopover() {};
  HTMLElement.prototype.hidePopover = function hidePopover() {};
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});
