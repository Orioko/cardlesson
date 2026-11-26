// Расписание сервера: он работает на домашнем ПК по будням в рабочие часы.
// Вне этого времени приложение и сайт работают без него, а изменения досылают, когда он появится.
// Время — местное время устройства (сервер и пользователь в одном часовом поясе).
// Если расписание поменяется, его нужно поправить здесь и в backend/deploy/windows/cardlesson-pc.env.
export const SERVER_SCHEDULE = {
  weekdays: [1, 2, 3, 4, 5], // пн–пт (0 — воскресенье, как в Date.getDay)
  fromHour: 10,
  toHour: 20,
} as const;

export const isWithinServerHours = (date: Date = new Date()): boolean => {
  const hour = date.getHours();
  return (
    (SERVER_SCHEDULE.weekdays as readonly number[]).includes(date.getDay()) &&
    hour >= SERVER_SCHEDULE.fromHour &&
    hour < SERVER_SCHEDULE.toHour
  );
};

const pad = (hour: number): string => `${String(hour).padStart(2, '0')}:00`;

export const SERVER_HOURS_LABEL = {
  from: pad(SERVER_SCHEDULE.fromHour),
  to: pad(SERVER_SCHEDULE.toHour),
};

// Сервер сам по таймеру не опрашивается: синхронизация идёт при запуске, при возврате
// в приложение, после изменений и при появлении сети. Повтор по таймеру — только если есть
// неотправленные изменения и сейчас часы работы сервера.
export const RETRY_PENDING_MS = 5 * 60_000;
