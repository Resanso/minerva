"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Map as MaplibreMap } from "maplibre-gl";
import type {
  BasemapId,
  ChatMessage,
  ChatSession,
  InspectResult,
  LeftMode,
  MapTool,
  MockLayer,
  MockUser,
  RightPanel,
} from "./types";
import { FALLBACK_REPLY, SEED_SESSIONS, replyFor } from "./mock-data";

export interface MapPin {
  id: string;
  lng: number;
  lat: number;
  label: string;
}

export interface Notice {
  id: string;
  text: string;
}

function uid(prefix: string) {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return `${prefix}-${crypto.randomUUID()}`;
    }
  } catch {
    /* ignore */
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

interface GeoGemmaState {
  leftExpanded: boolean;
  leftMode: LeftMode;
  rightPanel: RightPanel;
  basemap: BasemapId;
  sessions: ChatSession[];
  activeSessionId: string;
  layers: MockLayer[];
  layerRevision: number;
  pins: MapPin[];
  mapTool: MapTool;
  inspectResult: InspectResult | null;
  user: MockUser | null;
  authDismissed: boolean;
  chatOpen: boolean;
  typing: boolean;
  notices: Notice[];
  toggleLeft: () => void;
  setLeftMode: (m: LeftMode) => void;
  newChat: () => void;
  selectChat: (id: string) => void;
  renameChat: (id: string, title: string) => void;
  deleteChat: (id: string) => void;
  toggleRight: (p: Exclude<RightPanel, null>) => void;
  closeRight: () => void;
  setBasemap: (b: BasemapId) => void;
  addLayer: (layer: MockLayer) => void;
  removeLayer: (id: string) => void;
  toggleLayerVisibility: (id: string) => void;
  moveLayer: (id: string, dir: -1 | 1) => void;
  clearLayers: () => void;
  addPin: (lng: number, lat: number, label: string) => void;
  setMapTool: (t: MapTool) => void;
  setInspectResult: (r: InspectResult | null) => void;
  signInMock: () => void;
  dismissAuth: () => void;
  setChatOpen: (open: boolean) => void;
  pushNotice: (text: string) => void;
  submitQuery: (query: string) => void;
  registerMap: (map: MaplibreMap | null) => void;
  flyTo: (lng: number, lat: number, zoom?: number) => void;
}

const GeoGemmaContext = createContext<GeoGemmaState | null>(null);

const AUTH_KEY = "geogemma-mock-auth";

function readAuth(): { dismissed: boolean; user: MockUser | null } {
  try {
    const v = localStorage.getItem(AUTH_KEY);
    if (v === "user") return { dismissed: true, user: { name: "Guest Researcher", initial: "G" } };
    if (v === "1") return { dismissed: true, user: null };
  } catch {
    /* ignore */
  }
  return { dismissed: false, user: null };
}

export function GeoGemmaProvider({ children }: { children: React.ReactNode }) {
  const mapRef = useRef<MaplibreMap | null>(null);
  const [leftExpanded, setLeftExpanded] = useState(false);
  const [leftMode, setLeftMode] = useState<LeftMode>("chat");
  const [rightPanel, setRightPanel] = useState<RightPanel>(null);
  const [basemap, setBasemap] = useState<BasemapId>("dark");
  const [sessions, setSessions] = useState<ChatSession[]>(() => [
    {
      id: "conv-active",
      title: "New conversation",
      createdAt: new Date().toISOString(),
      messages: [],
    },
    ...SEED_SESSIONS,
  ]);
  const [activeSessionId, setActiveSessionId] = useState("conv-active");
  const [layers, setLayers] = useState<MockLayer[]>([]);
  const [layerRevision, setLayerRevision] = useState(0);
  const [pins, setPins] = useState<MapPin[]>([]);
  const [mapTool, setMapTool] = useState<MapTool>("pan");
  const [inspectResult, setInspectResult] = useState<InspectResult | null>(null);
  const [auth, setAuth] = useState(readAuth);
  const [chatOpen, setChatOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);

  const pushNotice = useCallback((text: string) => {
    const id = uid("notice");
    setNotices((prev) => [...prev.slice(-2), { id, text }]);
    window.setTimeout(() => {
      setNotices((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  }, []);

  const registerMap = useCallback((map: MaplibreMap | null) => {
    mapRef.current = map;
  }, []);

  const flyTo = useCallback((lng: number, lat: number, zoom?: number) => {
    try {
      mapRef.current?.flyTo({ center: [lng, lat], zoom: zoom ?? 5, duration: 1600 });
    } catch {
      /* map not ready */
    }
  }, []);

  const toggleLeft = useCallback(() => setLeftExpanded((v) => !v), []);

  const newChat = useCallback(() => {
    const id = uid("chat");
    setSessions((prev) => [
      { id, title: "New conversation", createdAt: new Date().toISOString(), messages: [] },
      ...prev,
    ]);
    setActiveSessionId(id);
    setChatOpen(true);
  }, []);

  const selectChat = useCallback((id: string) => {
    setActiveSessionId(id);
    setChatOpen(true);
  }, []);

  const renameChat = useCallback((id: string, title: string) => {
    const clean = title.trim();
    if (!clean) return;
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, title: clean.slice(0, 60) } : s)));
  }, []);

  const deleteChat = useCallback((id: string) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (next.length === 0) {
        const fresh: ChatSession = {
          id: uid("chat"),
          title: "New conversation",
          createdAt: new Date().toISOString(),
          messages: [],
        };
        setActiveSessionId(fresh.id);
        return [fresh];
      }
      setActiveSessionId((cur) => (cur === id ? next[0].id : cur));
      return next;
    });
  }, []);

  const toggleRight = useCallback((p: Exclude<RightPanel, null>) => {
    setRightPanel((prev) => (prev === p ? null : p));
  }, []);

  const closeRight = useCallback(() => setRightPanel(null), []);

  const addLayer = useCallback(
    (layer: MockLayer) => {
      setLayers((prev) => {
        if (prev.some((l) => l.id === layer.id)) {
          return prev.map((l) => (l.id === layer.id ? { ...l, visible: true } : l));
        }
        return [...prev, layer];
      });
      setLayerRevision((v) => v + 1);
    },
    []
  );

  const removeLayer = useCallback((id: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== id));
    setLayerRevision((v) => v + 1);
  }, []);

  const toggleLayerVisibility = useCallback((id: string) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)));
  }, []);

  const moveLayer = useCallback((id: string, dir: -1 | 1) => {
    setLayers((prev) => {
      const i = prev.findIndex((l) => l.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setLayerRevision((v) => v + 1);
  }, []);

  const clearLayers = useCallback(
    (silent = false) => {
      setLayers([]);
      setLayerRevision((v) => v + 1);
      if (!silent) pushNotice("All layers cleared successfully");
    },
    [pushNotice]
  );

  const addPin = useCallback((lng: number, lat: number, label: string) => {
    setPins((prev) => [...prev.slice(-19), { id: uid("pin"), lng, lat, label }]);
  }, []);

  const appendMessage = useCallback((sessionId: string, msg: ChatMessage) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        const title =
          s.messages.length === 0 && msg.role === "user"
            ? msg.content.slice(0, 42)
            : s.title === "New conversation" && s.messages.length <= 1 && msg.role === "user"
              ? msg.content.slice(0, 42)
              : s.title;
        return { ...s, title, messages: [...s.messages, msg] };
      })
    );
  }, []);

  const submitQuery = useCallback(
    (raw: string) => {
      const query = raw.trim();
      if (!query || typing) return;
      setChatOpen(true);
      const targetId = activeSessionId;
      appendMessage(targetId, { id: uid("msg"), role: "user", content: query });
      setTyping(true);

      const canned = replyFor(query);
      if (canned) {
        if (canned.layer) {
          try {
            addLayer(canned.layer());
          } catch {
            /* ignore */
          }
        }
        if (canned.flyTo) flyTo(canned.flyTo.lng, canned.flyTo.lat, canned.flyTo.zoom);
        window.setTimeout(() => {
          appendMessage(targetId, { id: uid("msg"), role: "assistant", content: canned.reply });
          setTyping(false);
        }, 900);
        return;
      }

      // Geographic query → Nominatim geocode + fly; anything else → fallback reply.
      const looksGeographic = /^(where|show|fly|zoom|go to|find|locate)\b/i.test(query) || /^[A-Z][a-z]+(?:[ ,][A-Za-z ]+)*$/.test(query);
      if (!looksGeographic) {
        window.setTimeout(() => {
          appendMessage(targetId, { id: uid("msg"), role: "assistant", content: FALLBACK_REPLY });
          setTyping(false);
        }, 900);
        return;
      }
      const ctrl = new AbortController();
      const timer = window.setTimeout(() => ctrl.abort(), 8000);
      fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`, {
        signal: ctrl.signal,
        headers: { Accept: "application/json" },
      })
        .then((r) => (r.ok ? r.json() : []))
        .then((arr: { lat: string; lon: string; display_name: string }[]) => {
          if (Array.isArray(arr) && arr.length > 0) {
            const lng = Number(arr[0].lon);
            const lat = Number(arr[0].lat);
            flyTo(lng, lat, 6);
            addPin(lng, lat, arr[0].display_name.split(",").slice(0, 2).join(","));
            appendMessage(targetId, {
              id: uid("msg"),
              role: "assistant",
              content: `**${arr[0].display_name.split(",").slice(0, 3).join(",")}**\n\n- Coordinates: \`${lat.toFixed(4)}, ${lng.toFixed(4)}\`\n- Map centered — marker added\n\nAsk for analysis (e.g. *NDVI*, *population*) or add a layer from **Layers**.`,
            });
          } else {
            appendMessage(targetId, { id: uid("msg"), role: "assistant", content: FALLBACK_REPLY });
          }
        })
        .catch(() => {
          appendMessage(targetId, { id: uid("msg"), role: "assistant", content: FALLBACK_REPLY });
        })
        .finally(() => {
          window.clearTimeout(timer);
          setTyping(false);
        });
    },
    [activeSessionId, addLayer, addPin, appendMessage, flyTo, typing]
  );

  const signInMock = useCallback(() => {
    try {
      localStorage.setItem(AUTH_KEY, "user");
    } catch {
      /* ignore */
    }
    setAuth({ dismissed: true, user: { name: "Guest Researcher", initial: "G" } });
  }, []);

  const dismissAuth = useCallback(() => {
    try {
      if (!localStorage.getItem(AUTH_KEY)) localStorage.setItem(AUTH_KEY, "1");
    } catch {
      /* ignore */
    }
    setAuth((prev) => ({ ...prev, dismissed: true }));
  }, []);

  const value = useMemo<GeoGemmaState>(
    () => ({
      leftExpanded,
      leftMode,
      rightPanel,
      basemap,
      sessions,
      activeSessionId,
      layers,
      layerRevision,
      pins,
      mapTool,
      inspectResult,
      user: auth.user,
      authDismissed: auth.dismissed,
      chatOpen,
      typing,
      notices,
      toggleLeft,
      setLeftMode,
      newChat,
      selectChat,
      renameChat,
      deleteChat,
      toggleRight,
      closeRight,
      setBasemap,
      addLayer,
      removeLayer,
      toggleLayerVisibility,
      moveLayer,
      clearLayers: () => clearLayers(false),
      addPin,
      setMapTool,
      setInspectResult,
      signInMock,
      dismissAuth,
      setChatOpen,
      pushNotice,
      submitQuery,
      registerMap,
      flyTo,
    }),
    [
      leftExpanded, leftMode, rightPanel, basemap, sessions, activeSessionId,
      layers, layerRevision, pins, mapTool, inspectResult, auth, chatOpen,
      typing, notices, toggleLeft, setLeftMode, newChat, selectChat, renameChat,
      deleteChat, toggleRight, closeRight, setBasemap, addLayer, removeLayer,
      toggleLayerVisibility, moveLayer, clearLayers, addPin, setMapTool,
      setInspectResult, signInMock, dismissAuth, setChatOpen, pushNotice,
      submitQuery, registerMap, flyTo,
    ]
  );

  return <GeoGemmaContext.Provider value={value}>{children}</GeoGemmaContext.Provider>;
}

export function useGeoGemma() {
  const ctx = useContext(GeoGemmaContext);
  if (!ctx) throw new Error("useGeoGemma must be used within GeoGemmaProvider");
  return ctx;
}
