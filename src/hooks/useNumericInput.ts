import { useState, useCallback, useEffect } from "react";

/**
 * Manages the display string for a numeric input field cleanly:
 * - Shows empty string when the underlying value is 0 (lets placeholder show)
 * - Allows in-progress decimals like "1.", "0.0", ".5" while typing
 * - Selects all text on focus so typing replaces the value naturally
 * - Commits the parsed numeric value to state only when input is valid/complete
 * - Handles integer-only mode (allowDecimal: false) for piece counts
 */
export function useNumericInput(
  value: number,
  onChange: (n: number) => void,
  options: {
    allowDecimal?: boolean;
    min?: number;
  } = {}
) {
  const { allowDecimal = true, min = 0 } = options;

  // Internal display string — what the <input> actually renders
  const [display, setDisplay] = useState<string>(() =>
    value === 0 ? "" : String(value)
  );

  // Keep display in sync when the external value changes from outside
  // (e.g. reset, programmatic update) but only when not currently editing
  const [isFocused, setIsFocused] = useState(false);
  useEffect(() => {
    if (!isFocused) {
      setDisplay(value === 0 ? "" : String(value));
    }
  }, [value, isFocused]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;

      // Allow empty (user cleared the field)
      if (raw === "" || raw === "-") {
        setDisplay(raw);
        onChange(0);
        return;
      }

      if (allowDecimal) {
        // Allow trailing dot or trailing zeros after dot ("1.", "1.0", "1.50")
        if (/^(\d+\.?\d*|\.\d+)$/.test(raw)) {
          setDisplay(raw);
          // Only commit if it's a complete number (not just "1." or ".5" mid-type edge case)
          const parsed = parseFloat(raw);
          if (!isNaN(parsed)) {
            onChange(Math.max(min, parsed));
          }
        }
      } else {
        // Integer only
        if (/^\d+$/.test(raw)) {
          setDisplay(raw);
          const parsed = parseInt(raw, 10);
          if (!isNaN(parsed)) {
            onChange(Math.max(min, parsed));
          }
        }
      }
    },
    [allowDecimal, min, onChange]
  );

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    // Select all on focus so the user can just type to replace
    e.target.select();
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // On blur, normalise: parse whatever is in display and commit cleanly
    const parsed = parseFloat(display);
    if (isNaN(parsed) || display === "" || display === ".") {
      // Nothing valid — reset to empty display, commit 0
      setDisplay("");
      onChange(0);
    } else {
      const clamped = Math.max(min, parsed);
      onChange(clamped);
      // Normalise display: strip trailing dot, unnecessary trailing zeros
      setDisplay(
        allowDecimal
          ? String(clamped)
          : String(Math.round(clamped))
      );
    }
  }, [display, min, allowDecimal, onChange]);

  return {
    display,
    handleChange,
    handleFocus,
    handleBlur,
    isFocused,
  };
}
