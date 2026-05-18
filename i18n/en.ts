const en = {
  locale: 'en-US',
  tabs: {
    today: 'Today',
    calendar: 'Calendar',
    weather: 'Weather',
    checklists: 'Checklists',
    settings: 'Settings',
  },
  today: {
    title: 'Today',
    eventsTitle: 'Events Today',
    noEvents: 'No events today',
    allDay: 'All day',
    weather: 'Weather',
    weatherHint: 'Current temperature, conditions and weather icon',
    suggestions: 'Suggestions',
    suggestionsHint: 'Activity suggestions when the weather is good',
    checklist: 'Checklist',
    checklistHint: 'Tasks and to-dos for today',
  },
  calendar: {
    title: 'Calendar',
    noEvents: 'No events',
    newEvent: 'New Event',
    save: 'Save',
    allDay: 'All day',
    start: 'Start',
    end: 'End',
    locationPlaceholder: 'Location (optional)',
    color: 'Color',
    titlePlaceholder: 'Title',
    done: 'Done',
    months: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ],
    weekdays: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
  },
  checklists: {
    title: 'Checklists',
    newChecklist: 'New Checklist',
    titlePlaceholder: 'Checklist title...',
    addItemPlaceholder: 'Add item...',
    create: 'Create',
    active: 'Active',
    completed: 'Completed',
    empty: 'No checklists yet. Tap + to create one.',
  },
  settings: {
    title: 'Settings',
    language: 'Language',
    account: 'Account',
    accountHint: 'Profile, name and account management',
    appearance: 'Appearance',
    appearanceHint: 'Light / dark mode and theme preferences',
    notifications: 'Notifications',
    notificationsHint: 'Event reminders and weather alerts',
    weatherSource: 'Weather Source',
    weatherSourceHint: 'API key and location settings for weather data',
  },
  weather: {
    title: 'Weather',
    current: 'Current',
    currentHint: 'Temperature, feels like, conditions, humidity and wind speed',
    hourly: 'Hourly Forecast',
    hourlyHint: 'Horizontal scroll with temperature and icon per hour (next 24 h)',
    sevenDay: '7-Day Forecast',
    sevenDayHint: 'Daily overview with min/max temperature and precipitation probability',
  },
};

export type Translations = {
  locale: string;
  tabs: { today: string; calendar: string; weather: string; checklists: string; settings: string };
  today: { title: string; eventsTitle: string; noEvents: string; allDay: string; weather: string; weatherHint: string; suggestions: string; suggestionsHint: string; checklist: string; checklistHint: string };
  calendar: { title: string; noEvents: string; newEvent: string; save: string; allDay: string; start: string; end: string; locationPlaceholder: string; color: string; titlePlaceholder: string; done: string; months: string[]; weekdays: string[] };
  checklists: { title: string; newChecklist: string; titlePlaceholder: string; addItemPlaceholder: string; create: string; active: string; completed: string; empty: string };
  settings: { title: string; language: string; account: string; accountHint: string; appearance: string; appearanceHint: string; notifications: string; notificationsHint: string; weatherSource: string; weatherSourceHint: string };
  weather: { title: string; current: string; currentHint: string; hourly: string; hourlyHint: string; sevenDay: string; sevenDayHint: string };
};

export default en satisfies Translations;
