import { useEffect } from "react";

export function useKeyboardShortcuts(bindings: Record<string, () => void>) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isMod = event.metaKey || event.ctrlKey;
      if (isMod && key === "k" && bindings["mod+k"]) {
        event.preventDefault();
        bindings["mod+k"]();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [bindings]);
}
