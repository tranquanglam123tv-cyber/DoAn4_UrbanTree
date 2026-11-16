/**
 * UrbanTree - Global Overlay & Modal Stack Manager
 * Guarantees single top-most overlay closing on Escape,
 * handles unsaved changes guards, and restores focus to triggering elements.
 */

export type OverlayCloseHandler = () => boolean | void;

interface OverlayItem {
  id: string;
  close: OverlayCloseHandler;
  triggerElement?: HTMLElement | null;
}

const overlayStack: OverlayItem[] = [];
let isGlobalListenerAttached = false;

function initGlobalListener() {
  if (isGlobalListenerAttached || typeof window === 'undefined') return;
  isGlobalListenerAttached = true;

  window.addEventListener(
    'keydown',
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (overlayStack.length > 0) {
          e.preventDefault();
          e.stopPropagation();

          // Get top-most overlay
          const top = overlayStack[overlayStack.length - 1];
          const result = top.close();

          // If close was not explicitly canceled (false), pop it from the stack
          if (result !== false) {
            overlayStack.pop();

            // Restore focus to trigger element if available
            if (top.triggerElement && typeof top.triggerElement.focus === 'function') {
              try {
                top.triggerElement.focus();
              } catch {}
            }
          }
        }
      }
    },
    true // Capture phase to prevent multiple uncoordinated listeners from closing simultaneously
  );
}

/**
 * Register an overlay on top of the stack.
 * Returns an unregister cleanup function.
 */
export function registerOverlay(id: string, close: OverlayCloseHandler): () => void {
  initGlobalListener();

  const triggerElement =
    typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null;

  const existingIdx = overlayStack.findIndex((item) => item.id === id);
  if (existingIdx !== -1) {
    overlayStack[existingIdx] = {
      id,
      close,
      triggerElement: overlayStack[existingIdx].triggerElement || triggerElement,
    };
  } else {
    overlayStack.push({ id, close, triggerElement });
  }

  return () => {
    unregisterOverlay(id);
  };
}

/**
 * Unregister an overlay when it closes or unmounts.
 */
export function unregisterOverlay(id: string): void {
  const idx = overlayStack.findIndex((item) => item.id === id);
  if (idx !== -1) {
    const removed = overlayStack.splice(idx, 1)[0];
    if (removed && removed.triggerElement && typeof removed.triggerElement.focus === 'function') {
      try {
        removed.triggerElement.focus();
      } catch {}
    }
  }
}

/**
 * Check if any overlay is currently active.
 */
export function hasActiveOverlays(): boolean {
  return overlayStack.length > 0;
}

