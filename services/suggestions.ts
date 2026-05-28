import type { CalendarEvent } from '@/types/event';
import type { DailyItem } from '@/services/weather';

const OUTDOOR_KEYWORDS = [
  'laufen', 'joggen', 'running', 'jog',
  'radfahren', 'fahrrad', 'cycling', 'bike',
  'wandern', 'hiking', 'hike',
  'spazieren', 'spaziergang', 'walk', 'walking',
  'schwimmen', 'swim', 'swimming',
  'sport', 'fitness', 'workout', 'training',
  'tennis', 'fußball', 'soccer', 'basketball',
  'golf', 'klettern', 'bouldern', 'climbing',
];

export type Suggestion = {
  activity: string;
  emoji: string;
  date: Date;
  maxTemp: number;
  weatherCode: number;
};

function normalizeTitle(title: string): string {
  return title.toLowerCase().trim().replace(/[^\w\säöüß]/g, '');
}

function isOutdoor(title: string): boolean {
  const lower = title.toLowerCase();
  return OUTDOOR_KEYWORDS.some(kw => lower.includes(kw));
}

function activityEmoji(title: string): string {
  const l = title.toLowerCase();
  if (l.includes('laufen') || l.includes('joggen') || l.includes('running') || l.includes('jog')) return '🏃';
  if (l.includes('radfahren') || l.includes('fahrrad') || l.includes('cycling') || l.includes('bike')) return '🚴';
  if (l.includes('wandern') || l.includes('hiking')) return '🥾';
  if (l.includes('spazier') || l.includes('walk')) return '🚶';
  if (l.includes('schwimmen') || l.includes('swim')) return '🏊';
  if (l.includes('tennis')) return '🎾';
  if (l.includes('fußball') || l.includes('soccer')) return '⚽';
  if (l.includes('basketball')) return '🏀';
  if (l.includes('golf')) return '⛳';
  if (l.includes('klettern') || l.includes('bouldern') || l.includes('climbing')) return '🧗';
  return '🏃';
}

function isGoodWeather(d: DailyItem): boolean {
  return d.weatherCode <= 2 && d.maxTemp >= 8 && d.precipitationProbability <= 30;
}

// Scans past events to find outdoor activities that happen repeatedly on
// the same day of week, then checks if weather + schedule justify a suggestion.
export function generateSuggestions(
  events: CalendarEvent[],
  dailyForecast: DailyItem[],
): Suggestion[] {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 90);

  const past = events.filter(e => e.startAt < now && e.startAt >= cutoff);

  // Group by normalized title → count occurrences per day-of-week
  const groups = new Map<string, { original: string; dowCounts: number[]; total: number }>();
  for (const ev of past) {
    if (!isOutdoor(ev.title)) continue;
    const key = normalizeTitle(ev.title);
    if (!key) continue;
    const dow = ev.startAt.getDay();
    const g = groups.get(key);
    if (g) {
      g.dowCounts[dow]++;
      g.total++;
    } else {
      const dowCounts = [0, 0, 0, 0, 0, 0, 0];
      dowCounts[dow] = 1;
      groups.set(key, { original: ev.title, dowCounts, total: 1 });
    }
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const suggestions: Suggestion[] = [];
  const seenActivity = new Set<string>();

  outer:
  for (const daily of dailyForecast) {
    const date = new Date(daily.date + 'T12:00:00');
    if (date < today) continue;
    if (!isGoodWeather(daily)) continue;

    const dow = date.getDay();

    for (const [key, { original, dowCounts, total }] of groups) {
      // Need at least 2 total occurrences and at least 2 on this weekday
      if (total < 2 || dowCounts[dow] < 2) continue;

      // Skip if already scheduled this day
      const alreadyScheduled = events.some(ev => {
        const s = ev.startAt;
        return (
          s.getFullYear() === date.getFullYear() &&
          s.getMonth() === date.getMonth() &&
          s.getDate() === date.getDate() &&
          normalizeTitle(ev.title) === key
        );
      });
      if (alreadyScheduled) continue;

      if (seenActivity.has(key)) continue;
      seenActivity.add(key);

      suggestions.push({
        activity: original,
        emoji: activityEmoji(original),
        date,
        maxTemp: Math.round(daily.maxTemp),
        weatherCode: daily.weatherCode,
      });

      if (suggestions.length >= 3) break outer;
    }
  }

  return suggestions;
}
