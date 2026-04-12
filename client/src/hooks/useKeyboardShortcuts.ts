import { useEffect, useRef } from "react";

type ShortcutAction =
  | "openCommandPalette"
  | "sendBuilderRequest"
  | "clearLogs"
  | "newBuilderTab"
  | "closeActiveTab"
  | "toggleTunnel"
  | "newEndpoint"
  | "goToDashboard"
  | "goToSimulator"
  | "goToBuilder"
  | "goToCollections"
  | "goToHistory"
  | "goToEnvironments"
  | "showShortcutsHelp"
  | "closeAll";

type ShortcutHandlers = Partial<Record<ShortcutAction, () => void>>;

function isTextInputTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select";
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const sequenceRef = useRef<{ key: string; ts: number } | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isMod = event.metaKey || event.ctrlKey;
      const inInput = isTextInputTarget(event.target);

      if (isMod && key === "k") {
        event.preventDefault();
        handlers.openCommandPalette?.();
        return;
      }

      if (event.ctrlKey && !event.metaKey && key === "p") {
        event.preventDefault();
        handlers.openCommandPalette?.();
        return;
      }

      if (inInput) {
        return;
      }

      if (isMod && event.shiftKey && key === "c") {
        event.preventDefault();
        handlers.clearLogs?.();
        return;
      }

      if (isMod && event.shiftKey && key === "t") {
        event.preventDefault();
        handlers.toggleTunnel?.();
        return;
      }

      if (isMod && event.shiftKey && key === "n") {
        event.preventDefault();
        handlers.newEndpoint?.();
        return;
      }

      if (key === "?") {
        event.preventDefault();
        handlers.showShortcutsHelp?.();
        return;
      }

      if (key === "escape") {
        handlers.closeAll?.();
        return;
      }

      const now = Date.now();
      if (sequenceRef.current && now - sequenceRef.current.ts < 1200) {
        const prev = sequenceRef.current.key;
        const combo = `${prev} ${key}`;
        sequenceRef.current = null;

        if (combo === "g d") handlers.goToDashboard?.();
        if (combo === "g s") handlers.goToSimulator?.();
        if (combo === "g b") handlers.goToBuilder?.();
        if (combo === "g c") handlers.goToCollections?.();
        if (combo === "g h") handlers.goToHistory?.();
        if (combo === "g e") handlers.goToEnvironments?.();
        return;
      }

      if (key === "g") {
        sequenceRef.current = { key: "g", ts: now };
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [handlers]);
}
