import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";

const EventContext = createContext(null);
const ACTIVE_KEY = "occasio.activeEventId";

/**
 * Holds every plan the user owns and which one is currently open. The active
 * event id is remembered in localStorage so a refresh lands you back on the
 * event you were planning.
 */
export function EventProvider({ children }) {
  const [events, setEvents] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (preferredId) => {
    const page = await base44.entities.Event.filter({}, { sort: "-created_date", limit: 100 });
    const list = page.items ?? [];
    const remembered = preferredId || localStorage.getItem(ACTIVE_KEY);
    const found = list.find((e) => e.id === remembered) || list[0] || null;

    if (found) localStorage.setItem(ACTIVE_KEY, found.id);
    else localStorage.removeItem(ACTIVE_KEY);

    setEvents(list);
    setActiveId(found ? found.id : null);
    setLoading(false);
    return list;
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeEvent = useMemo(
    () => events.find((e) => e.id === activeId) || null,
    [events, activeId],
  );

  const selectEvent = useCallback((id) => {
    localStorage.setItem(ACTIVE_KEY, id);
    setActiveId(id);
  }, []);

  /** Keeps the in-memory copy in step after an edit, without a network round trip. */
  const patchEvent = useCallback((id, patch) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);

  /** Called by onboarding right after a new plan is created. */
  const addEvent = useCallback((event) => {
    localStorage.setItem(ACTIVE_KEY, event.id);
    setEvents((prev) => [event, ...prev]);
    setActiveId(event.id);
  }, []);

  const removeEvent = useCallback((id) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setActiveId((prev) => (prev === id ? null : prev));
  }, []);

  const value = useMemo(
    () => ({ events, activeEvent, loading, selectEvent, patchEvent, addEvent, removeEvent, refresh: load }),
    [events, activeEvent, loading, selectEvent, patchEvent, addEvent, removeEvent, load],
  );

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export function useEvent() {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error("useEvent must be used inside EventProvider");
  return ctx;
}