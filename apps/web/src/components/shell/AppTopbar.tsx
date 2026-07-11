import { Bell, Menu, Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getShellViewTitle } from "./viewTitles";
import { NotificationPanel } from "./NotificationPanel";
import { GlobalSearchOverlay } from "./GlobalSearchOverlay";
import type { ShellVariant } from "./types";

type AppTopbarProps = {
  activeView: string;
  isClientRole?: boolean;
  navOpen?: boolean;
  onNavToggle?: () => void;
  shellVariant: ShellVariant;
  token?: string | null;
};

const API_BASE_URL = "/api/v1";

type InboxUnreadResponse = {
  ok: boolean;
  data?: {
    unreadCount?: number;
  };
};

function getUnreadEndpoint(isClientRole: boolean): string {
  return isClientRole ? "/client-portal/notifications/unread" : "/notifications/inbox/unread";
}

export function AppTopbar({
  activeView,
  isClientRole = false,
  navOpen = false,
  onNavToggle,
  shellVariant,
  token = null
}: AppTopbarProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const title = getShellViewTitle(activeView, shellVariant);
  const titleId = useId();
  const notifyBtnRef = useRef<HTMLButtonElement | null>(null);
  const searchBtnRef = useRef<HTMLButtonElement | null>(null);
  const overlayOpen = notificationsOpen || searchOpen;

  useEffect(() => {
    if (!token) {
      setUnreadCount(0);
      return;
    }

    let cancelled = false;
    async function loadUnreadCount() {
      const response = await fetch(`${API_BASE_URL}${getUnreadEndpoint(isClientRole)}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok || cancelled) {
        return;
      }

      const payload = (await response.json()) as InboxUnreadResponse;
      if (cancelled) {
        return;
      }
      setUnreadCount(typeof payload.data?.unreadCount === "number" ? payload.data.unreadCount : 0);
    }

    void loadUnreadCount();
    return () => {
      cancelled = true;
    };
  }, [token, isClientRole, notificationsOpen]);

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
        {onNavToggle ? (
          <button
            type="button"
            className="shell-topbar__icon-btn shell-topbar__menu-btn"
            aria-label={navOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={navOpen}
            aria-controls="shell-primary-nav"
            onClick={onNavToggle}
          >
            {navOpen ? (
              <X size={14} strokeWidth={2} aria-hidden="true" />
            ) : (
              <Menu size={14} strokeWidth={2} aria-hidden="true" />
            )}
          </button>
        ) : null}
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
          aria-label={unreadCount > 0 ? `Open notifications (${unreadCount} unread)` : "Open notifications"}
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
            <>
              <Bell size={14} strokeWidth={2} aria-hidden="true" />
              {unreadCount > 0 ? (
                <span className="shell-topbar__icon-badge" aria-hidden="true">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </>
          )}
        </button>
      </div>

      {notificationsOpen ? (
        <NotificationPanel
          isClientRole={isClientRole}
          onUnreadCountChange={setUnreadCount}
          onClose={() => {
            setNotificationsOpen(false);
            notifyBtnRef.current?.focus();
          }}
          token={token}
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
