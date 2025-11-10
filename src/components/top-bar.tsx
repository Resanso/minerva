"use client";

import type { KeyboardEvent, SVGProps } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type IconProps = SVGProps<SVGSVGElement>;

const SearchIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    role="img"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <path
      d="M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm8.5 14.5-3.3-3.3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

const BellIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    role="img"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <path
      d="M18 14V11a6 6 0 0 0-12 0v3l-1.5 2h15Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M10 18a2 2 0 0 0 4 0"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

const UserIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    role="img"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <path
      d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-8 8a8 8 0 0 1 16 0"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

const MoonIcon = (props: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    role="img"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <path
      d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

type ModelSummary = {
  id: string;
  label: string;
};

type NotificationSeverity = "critical" | "warning" | "info";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  severity: NotificationSeverity;
  machineId?: string;
  read?: boolean;
};

const toTitleCase = (value: string) =>
  value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/(^|\s)\w/g, (match) => match.toUpperCase());

const severityVisuals: Record<
  NotificationSeverity,
  { dot: string; pill: string }
> = {
  critical: {
    dot: "bg-red-500",
    pill: "text-red-400",
  },
  warning: {
    dot: "bg-yellow-400",
    pill: "text-yellow-300",
  },
  info: {
    dot: "bg-blue-400",
    pill: "text-blue-300",
  },
};

const formatTimestamp = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const createClientId = () => {
  try {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID();
    }
  } catch (err) {
    /* ignore */
  }
  return `notif-${Math.random().toString(36).slice(2, 10)}`;
};

export default function TopBar() {
  const [query, setQuery] = useState("");
  const [models, setModels] = useState<ModelSummary[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const notificationDropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const response = await fetch("/3d-model/models.json", {
          cache: "no-store",
        });
        if (!response.ok) throw new Error(response.statusText);
        const json = await response.json();
        if (!isMounted) return;
        const list = Array.isArray(json)
          ? json
          : Array.isArray(json?.models)
          ? json.models
          : [];
        const seen = new Set<string>();
        const summaries: ModelSummary[] = [];
        for (const item of list) {
          if (!item || typeof item !== "object") continue;
          const id = typeof item.id === "string" ? item.id.trim() : "";
          if (!id || seen.has(id)) continue;
          seen.add(id);
          summaries.push({ id, label: toTitleCase(id) || id });
        }
        setModels(summaries);
      } catch (err) {
        console.error("Failed to load model list for search", err);
        if (!isMounted) return;
        setModels([]);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const response = await fetch("/notification-data.json", {
          cache: "no-store",
        });
        if (!response.ok) throw new Error(response.statusText);
        const json = await response.json();
        if (!isMounted) return;
        const list = Array.isArray(json?.notifications)
          ? json.notifications
          : [];
        const parsed: NotificationItem[] = list
          .filter((item: any) => item && typeof item === "object")
          .map((item: any) => {
            const severity: NotificationSeverity =
              item.severity === "critical" ||
              item.severity === "warning" ||
              item.severity === "info"
                ? item.severity
                : "info";
            return {
              id: String(item.id ?? createClientId()),
              title: String(item.title ?? "Notification"),
              message: String(item.message ?? "-"),
              timestamp: String(item.timestamp ?? new Date().toISOString()),
              machineId:
                typeof item.machineId === "string" ? item.machineId : undefined,
              severity,
              read: Boolean(item.read),
            } satisfies NotificationItem;
          });
        // sort descending by timestamp to mimic backend ordering
        parsed.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setNotifications(parsed);
      } catch (err) {
        console.error("Failed to load notifications", err);
        if (!isMounted) return;
        setNotifications([]);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      const isInsideSearch = Boolean(
        target && searchContainerRef.current?.contains(target)
      );
      const isInsideNotifications = Boolean(
        target && notificationDropdownRef.current?.contains(target)
      );
      if (isInsideSearch || isInsideNotifications) return;
      setIsDropdownOpen(false);
      setIsMobileSearchActive(false);
      setIsNotificationsOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const filteredModels = useMemo(() => {
    if (!query.trim()) {
      return models.slice(0, 8);
    }
    const needle = query.trim().toLowerCase();
    return models
      .filter(
        (item) =>
          item.id.toLowerCase().includes(needle) ||
          item.label.toLowerCase().includes(needle)
      )
      .slice(0, 8);
  }, [models, query]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [notifications]);

  const handleSelect = (item: ModelSummary) => {
    try {
      window.dispatchEvent(
        new CustomEvent("__openModelModal", { detail: { id: item.id } })
      );
    } catch (err) {
      console.error("Failed to dispatch model modal event", err);
    }
    setQuery("");
    setIsDropdownOpen(false);
    setIsMobileSearchActive(false);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!filteredModels.length) {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
        setIsMobileSearchActive(false);
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsDropdownOpen(true);
      setActiveIndex((prev) => (prev + 1) % filteredModels.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsDropdownOpen(true);
      setActiveIndex((prev) =>
        prev === 0 ? filteredModels.length - 1 : prev - 1
      );
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const candidate = filteredModels[activeIndex];
      if (candidate) handleSelect(candidate);
      return;
    }
    if (event.key === "Escape") {
      setIsDropdownOpen(false);
      setIsMobileSearchActive(false);
      return;
    }
  };

  const handleNotificationToggle = () => {
    setIsNotificationsOpen((prev) => {
      const next = !prev;
      if (next) {
        setNotifications((current) =>
          current.map((item) => ({ ...item, read: true }))
        );
      }
      return next;
    });
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (item.machineId) {
      try {
        window.dispatchEvent(
          new CustomEvent("__openModelModal", {
            detail: { id: item.machineId },
          })
        );
      } catch (err) {
        console.error("Failed to open model modal from notification", err);
      }
    }
    setIsNotificationsOpen(false);
    setNotifications((current) =>
      current.map((entry) =>
        entry.id === item.id ? { ...entry, read: true } : entry
      )
    );
  };

  return (
    <header className="pointer-events-none fixed inset-x-0 top-6 z-40 flex justify-center bg-transparent">
      <div className="pointer-events-auto flex h-14 w-full max-w-6xl items-center gap-6 bg-transparent px-6">
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="uppercase tracking-[0.18em] text-[10px] text-slate-300"
          >
            Nama Pabrik
          </Badge>
          <Badge className="bg-blue-500 text-white shadow-[0_0_18px_rgba(59,130,246,0.45)]">
            Gedung E
          </Badge>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div
            ref={searchContainerRef}
            className={`relative ${
              isMobileSearchActive ? "block w-full" : "hidden md:block"
            } md:w-64`}
          >
            <Input
              ref={inputRef}
              placeholder="Search..."
              className="pl-10"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onKeyDown={handleInputKeyDown}
            />
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 rounded-xl border border-white/10 bg-slate-950/95 p-2 shadow-xl backdrop-blur">
                {filteredModels.length ? (
                  filteredModels.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                        index === activeIndex
                          ? "bg-blue-500/20 text-white"
                          : "text-slate-200 hover:bg-slate-800/80"
                      }`}
                    >
                      <span className="truncate">{item.label}</span>
                      <span className="ml-3 shrink-0 text-xs text-slate-500">
                        {item.id}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="rounded-lg px-3 py-4 text-sm text-slate-400">
                    No models found.
                  </div>
                )}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Search"
            onClick={() => {
              setIsMobileSearchActive((prev) => {
                const next = !prev;
                if (next) {
                  setIsDropdownOpen(true);
                  requestAnimationFrame(() => inputRef.current?.focus());
                } else {
                  setIsDropdownOpen(false);
                }
                return next;
              });
            }}
          >
            <SearchIcon className="h-4 w-4" />
          </Button>
          <div ref={notificationDropdownRef} className="relative">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              onClick={handleNotificationToggle}
            >
              <span className="relative inline-flex">
                <BellIcon className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                )}
              </span>
            </Button>
            {isNotificationsOpen && (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-72 rounded-xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl backdrop-blur">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-100">
                    Notifications
                  </span>
                  <span className="text-xs text-slate-400">
                    {unreadCount} unread
                  </span>
                </div>
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {sortedNotifications.length ? (
                    sortedNotifications.map((item) => {
                      const visuals =
                        severityVisuals[item.severity] ?? severityVisuals.info;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleNotificationClick(item)}
                          className="flex w-full flex-col gap-1 rounded-lg border border-white/5 bg-slate-900/60 px-3 py-2 text-left transition hover:border-blue-400/40 hover:bg-slate-800/80"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div
                              className={`flex items-center gap-2 font-semibold text-slate-100`}
                            >
                              <span
                                className={`h-2.5 w-2.5 rounded-full ${visuals.dot}`}
                              />
                              <span>{item.title}</span>
                            </div>
                            <span className="text-right text-[11px] text-slate-500">
                              {formatTimestamp(item.timestamp)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300">
                            {item.message}
                          </p>
                          {item.machineId && (
                            <span
                              className={`text-[11px] uppercase tracking-[0.15em] ${visuals.pill}`}
                            >
                              {item.machineId}
                            </span>
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-sm text-slate-500">
                      No notifications
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" aria-label="Profile">
            <UserIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            className="gap-2 px-4 text-slate-200 hover:text-white"
            aria-label="Toggle theme"
          >
            <MoonIcon className="h-4 w-4" />
            <span className="text-sm font-medium">Dark</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
