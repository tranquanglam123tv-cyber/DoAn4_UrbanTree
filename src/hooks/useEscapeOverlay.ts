import { useEffect, useRef } from 'react';
import { registerOverlay, OverlayCloseHandler } from '../utils/overlayStack';

/**
 * Hook to register an overlay or modal into the global Escape stack.
 * Ensures that only the top-most overlay is closed when pressing Escape,
 * and allows preventing closing if unsaved changes are detected.
 *
 * @param id Unique identifier for this overlay
 * @param isOpen Whether the overlay is currently visible
 * @param onClose Callback when closing (return false to abort close, e.g. user canceled confirm)
 */
export function useEscapeOverlay(
  id: string,
  isOpen: boolean,
  onClose: OverlayCloseHandler
) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const unregister = registerOverlay(id, () => {
      return onCloseRef.current();
    });

    return unregister;
  }, [id, isOpen]);
}

