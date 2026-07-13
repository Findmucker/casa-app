export const DEFAULT_REMINDER_TIME_ZONE = "Europe/Lisbon";
export const DEFAULT_REMINDER_WINDOW_MINUTES = 180;

export interface LocalClock {
  date: string;
  day: number;
  minutes: number;
  time: string;
}

export interface ReminderOccurrence extends LocalClock {
  elapsedMinutes: number;
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function getLocalClock(now: Date, timeZone = DEFAULT_REMINDER_TIME_ZONE): LocalClock {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || "";
  const hour = Number(value("hour"));
  const minute = Number(value("minute"));

  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    day: WEEKDAY_INDEX[value("weekday")] ?? 0,
    minutes: hour * 60 + minute,
    time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  };
}

function previousDate(date: string): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() - 1);
  return value.toISOString().slice(0, 10);
}

export function getReminderOccurrence(
  now: Date,
  reminderTime: string,
  timeZone = DEFAULT_REMINDER_TIME_ZONE,
  windowMinutes = DEFAULT_REMINDER_WINDOW_MINUTES,
): ReminderOccurrence | null {
  const match = /^(\d{2}):(\d{2})$/.exec(reminderTime);
  if (!match) return null;

  const reminderMinutes = Number(match[1]) * 60 + Number(match[2]);
  if (reminderMinutes < 0 || reminderMinutes >= 24 * 60 || Number(match[2]) >= 60) return null;

  const local = getLocalClock(now, timeZone);
  let elapsedMinutes = local.minutes - reminderMinutes;
  let date = local.date;
  let day = local.day;

  if (elapsedMinutes < 0) {
    elapsedMinutes += 24 * 60;
    date = previousDate(date);
    day = (day + 6) % 7;
  }

  if (elapsedMinutes > windowMinutes) return null;
  return { ...local, date, day, elapsedMinutes };
}
