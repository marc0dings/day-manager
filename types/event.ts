export type EventParticipant = {
  id: string;
  name: string;
  avatarUrl?: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startAt: Date;
  endAt: Date;
  allDay: boolean;
  participants: EventParticipant[];
  createdBy: string;
  color?: string;
};

export type SharedCalendar = {
  id: string;
  name: string;
  shareToken: string;
  members: EventParticipant[];
  events: CalendarEvent[];
};
