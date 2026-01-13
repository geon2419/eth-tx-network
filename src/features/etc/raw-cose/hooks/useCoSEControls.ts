import { useCallback, useState } from "react";

import { DEFAULT_CONTROLS } from "../domain/constants";
import type { ControlState } from "../types";

type UseCoSEControlsResult = {
  controls: ControlState;
  handleControlChange: (key: keyof ControlState, value: number) => void;
};

/**
 * Manages CoSE layout control parameters with optimized state updates.
 *
 * @param initialControls - Initial control values (defaults to DEFAULT_CONTROLS)
 * @returns Control state and update handler
 *
 * @example
 * ```ts
 * const { controls, handleControlChange } = useCoSEControls();
 * handleControlChange('repulsion', 5000);
 * // controls: { repulsion: 5000, gravity: 0.1, ... }
 * ```
 */
export const useCoSEControls = (
  initialControls: ControlState = DEFAULT_CONTROLS
): UseCoSEControlsResult => {
  const [controls, setControls] = useState<ControlState>(initialControls);

  const handleControlChange = useCallback(
    (key: keyof ControlState, value: number) => {
      setControls((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  return { controls, handleControlChange };
};
