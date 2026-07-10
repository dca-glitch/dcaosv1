import { Bell, Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getShellViewTitle } from "./viewTitles";
import { NotificationPanel } from "./NotificationPanel";
import { GlobalSearchOverlay } from "./GlobalSearchOverlay";
import type { ShellVariant } from "./types";

type AppTopbarProps = {
  activeView: string;
  shellVariant: ShellVariant;
};

export function AppTopbar({ activeView, shellVariant }: AppTopbarProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const title = getShellViewTitle(activeView, shellVariant);
  const titleId = useId();
  const notifyBtnRef = useRef<HTMLButtonElement | null>(null);
  const searchBtnRef = useRef<HTMLButtonElement | null>(null);
  const overlayOpen = notificationsOpen || searchOpen;

  useEffect(() => {
    if (!overlayOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (searchOpen) {
          setSearchOpen(false);
          searchBtnRef.current?.focus();
        } else if (notificationsOpen) {
          setNotificationsOpen(false);
          notifyBtnRef.current?.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [notificationsOpen, searchOpen, overlayOpen]);

  useEffect(() => {
    if (!overlayOpen) {
      return;
    }

    const body = document.body;
    const main = document.getElementById("shell-main-content");
    const previousBodyOverflow = body.style.overflow;
    const previousMainOverflow = main?.style.overflow ?? "";

    body.style.overflow = "hidden";
    if (main) {
      main.style.overflow = "hidden";
    }

    return () => {
      body.style.overflow = previousBodyOverflow;
      if (main) {
        main.style.overflow = previousMainOverflow;
      }
    };
  }, [overlayOpen]);

  return (
    <header className="shell-topbar" data-shell-variant={shellVariant}>
      <div className="shell-topbar__leading">
        <p className="shell-topbar__title" id={titleId}>
          {title}
        </p>
      </div>
      <div className="shell-topbar__actions" role="group" aria-label="Shell controls">
        <button
          ref={searchBtnRef}
          type="button"
          className="shell-topbar__icon-btn"
          aria-label="Open search"
          aria-expanded={searchOpen}
          aria-controls="shell-global-search"
          onClick={() => {
            setNotificationsOpen(false);
            setSearchOpen(true);
          }}
        >
          <Search size={14} strokeWidth={2} aria-hidden="true" />
        </button>
        <button
          ref={notifyBtnRef}
          type="button"
          className="shell-topbar__icon-btn"
          aria-label="Open notifications"
          aria-expanded={notificationsOpen}
          aria-controls="shell-notification-panel"
          onClick={() => {
            setSearchOpen(false);
            setNotificationsOpen((open) => !open);
          }}
        >
          {notificationsOpen ? (
            <X size={14} strokeWidth={2} aria-hidden="true" />
          ) : (
            <Bell size={14} strokeWidth={2} aria-hidden="true" />
          )}
        </button>
      </div>

      {notificationsOpen ? (
        <NotificationPanel
          onClose={() => {
            setNotificationsOpen(false);
            notifyBtnRef.current?.focus();
          }}
        />
      ) : null}

      {searchOpen
        ? createPortal(
            <GlobalSearchOverlay
              onClose={() => {
                setSearchOpen(false);
                searchBtnRef.current?.focus();
              }}
            />,
            document.body
          )
        : null}
    </header>
  );
}
