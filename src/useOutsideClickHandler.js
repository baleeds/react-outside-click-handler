import { useEffect, useCallback } from 'react';

const useOutsideClickHandler = (ref, onOutsideClick, options) => {
  // destructure here to prevent recalcs when the options object is not memoized
  const { useCapture, disabled } = options;

  const handleMouseUp = useCallback(
    (event) => {
      document.removeEventListener('mouseup', handleMouseUp);
      const isDescendantOfRoot = ref.current && ref.current.contains(event.target);
      if (!isDescendantOfRoot) {
        onOutsideClick(event);
      }
    },
    [ref, onOutsideClick],
  );

  const handleMouseDown = useCallback(
    (event) => {
      const isDescendantOfRoot = ref.current && ref.current.contains(event.target);
      if (!isDescendantOfRoot) {
        document.removeEventListener('mouseup', handleMouseUp);
        document.addEventListener('mouseup', handleMouseUp, {
          capture: useCapture,
        });
      }
    },
    [ref, useCapture, handleMouseUp],
  );

  useEffect(() => {
    if (!disabled) {
      document.addEventListener('mousedown', handleMouseDown, {
        capture: useCapture,
      });
    }

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseDown, handleMouseUp, useCapture, disabled]);
};

export default useOutsideClickHandler;
