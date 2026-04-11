import { useMemo, useState } from "react";

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  const api = useMemo(
    () => ({
      open,
      show: () => setOpen(true),
      hide: () => setOpen(false),
      toggle: () => setOpen((v) => !v)
    }),
    [open]
  );
  return api;
}
