import { useEffect, useRef, RefObject } from 'react';

export interface UseClickOutsideOptions {
  active?: boolean;
  closeOnEsc?: boolean;
  ignoreSelector?: string;
}

/**
 * Custom hook to detect clicks outside a referenced element and optionally handle Escape key.
 *
 * @param onClose Callback invoked when user clicks outside or presses Escape.
 * @param options Configuration options (active state, closeOnEsc, ignoreSelector).
 * @returns RefObject to attach to the inner container/dialog element.
 */
export function useClickOutside<T extends HTMLElement = HTMLDivElement>(
  onClose: () => void,
  options?: UseClickOutsideOptions
): RefObject<T> {
  const ref = useRef<T>(null);
  const active = options?.active ?? true;
  const closeOnEsc = options?.closeOnEsc ?? true;
  const ignoreSelector = options?.ignoreSelector;

  // Keep latest onClose reference
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!active) return;

    const handleMouseDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || !ref.current) return;

      // Click is inside the modal or menu container -> do nothing
      if (ref.current.contains(target)) {
        return;
      }

      // If click is on an ignored element (e.g. toggle button with ignoreSelector)
      if (ignoreSelector && target.closest && target.closest(ignoreSelector)) {
        return;
      }

      onCloseRef.current();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (closeOnEsc && event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
      }
    };

    // Use passive event listener for smoother scrolling and interactions
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('touchstart', handleMouseDown);
    if (closeOnEsc) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('touchstart', handleMouseDown);
      if (closeOnEsc) {
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [active, closeOnEsc, ignoreSelector]);

  return ref;
}

export default useClickOutside;
