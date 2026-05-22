import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

import type { CalendarEvent } from '@/types/event';

const STORAGE_KEY = '@day_manager_events_v1';

type EventsCtx = {
  events: CalendarEvent[];
  addEvent: (ev: Omit<CalendarEvent, 'id'>) => void;
  updateEvent: (ev: CalendarEvent) => void;
  deleteEvent: (id: string) => void;
  eventsForDate: (date: Date) => CalendarEvent[];
};

const Ctx = createContext<EventsCtx | null>(null);

function makeSeed(): CalendarEvent[] {
  const now = new Date();
  const [y, m, d] = [now.getFullYear(), now.getMonth(), now.getDate()];
  return [
    {
      id: 'seed-1',
      title: 'Standup',
      startAt: new Date(y, m, d, 9, 0),
      endAt: new Date(y, m, d, 9, 30),
      allDay: false,
      participants: [],
      createdBy: 'me',
      color: '#0a7ea4',
    },
    {
      id: 'seed-2',
      title: 'Design Review',
      location: 'Konferenzraum 2',
      startAt: new Date(y, m, d, 14, 0),
      endAt: new Date(y, m, d, 15, 0),
      allDay: false,
      participants: [],
      createdBy: 'me',
      color: '#34C759',
    },
  ];
}

function revive(e: any): CalendarEvent {
  return { ...e, startAt: new Date(e.startAt), endAt: new Date(e.endAt) };
}

export function EventsProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const ready = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      try {
        setEvents(raw ? (JSON.parse(raw) as any[]).map(revive) : makeSeed());
      } catch {
        setEvents(makeSeed());
      }
      ready.current = true;
    });
  }, []);

  useEffect(() => {
    if (!ready.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  function addEvent(ev: Omit<CalendarEvent, 'id'>) {
    const newEv: CalendarEvent = { ...ev, id: `ev-${Date.now()}` };
    setEvents(prev =>
      [...prev, newEv].sort((a, b) => a.startAt.getTime() - b.startAt.getTime()),
    );
  }

  function updateEvent(ev: CalendarEvent) {
    setEvents(prev =>
      prev
        .map(e => (e.id === ev.id ? ev : e))
        .sort((a, b) => a.startAt.getTime() - b.startAt.getTime()),
    );
  }

  function deleteEvent(id: string) {
    setEvents(prev => prev.filter(e => e.id !== id));
  }

  function eventsForDate(date: Date): CalendarEvent[] {
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
    return events
      .filter(e => {
        if (e.allDay) {
          const evStart = new Date(e.startAt.getFullYear(), e.startAt.getMonth(), e.startAt.getDate());
          const evEnd = new Date(e.endAt.getFullYear(), e.endAt.getMonth(), e.endAt.getDate());
          return dayStart >= evStart && dayStart <= evEnd;
        }
        return e.startAt <= dayEnd && e.endAt > dayStart;
      })
      .sort((a, b) => {
        if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
        return a.startAt.getTime() - b.startAt.getTime();
      });
  }

  return (
    <Ctx.Provider value={{ events, addEvent, updateEvent, deleteEvent, eventsForDate }}>
      {children}
    </Ctx.Provider>
  );
}

export function useEvents() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useEvents outside EventsProvider');
  return ctx;
}
