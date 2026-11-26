// Офлайн-словарь: изменения сразу видны на устройстве и копятся в очереди,
// а когда есть связь, очередь по порядку уходит на сервер.
//
// Что видит экран = последняя копия словаря с сервера + очередь локальных изменений поверх неё.
//
// Правила синхронизации:
//  - сетевая ошибка — останавливаемся, очередь ждёт связи (порядок изменений сохраняется);
//  - сервер отверг изменение (слово удалено с другого устройства, дубль, неверные данные) —
//    изменение отбрасываем: повторять его бессмысленно, сервер остаётся источником правды;
//  - правки одного слова с разных устройств: побеждает последняя отправленная.
//
// Модуль не знает ни про fetch, ни про конкретное хранилище — их передают веб и мобилка.
import type { Word, WordInput } from '../types/word';

export interface KeyValueStorage {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<void>;
  remove(key: string): Promise<void>;
}

export interface WordsTransport {
  list(): Promise<Word[]>;
  create(input: WordInput & { createdAt?: string }): Promise<Word>;
  update(id: string, patch: Partial<Word>): Promise<Word>;
  remove(id: string): Promise<void>;
}

type AddOp = { opId: string; kind: 'add'; localId: string; input: WordInput; createdAt: string };
type UpdateOp = { opId: string; kind: 'update'; id: string; patch: Partial<Word> };
type DeleteOp = { opId: string; kind: 'delete'; id: string };
type Op = AddOp | UpdateOp | DeleteOp;

interface QueueState {
  ops: Op[];
  // временный id → id на сервере: экран мог запомнить временный id до синхронизации
  idMap: Record<string, string>;
}

export const LOCAL_ID_PREFIX = 'local_';
const MAX_ID_MAP = 500;

export class DuplicateWordError extends Error {
  constructor() {
    super('DUPLICATE_WORD');
    this.name = 'DuplicateWordError';
  }
}

export class WordNotFoundError extends Error {
  constructor() {
    super('Word not found');
    this.name = 'WordNotFoundError';
  }
}

export class OfflineNoDataError extends Error {
  constructor() {
    super('OFFLINE_NO_DATA');
    this.name = 'OfflineNoDataError';
  }
}

// ---- сравнение слов: та же логика, что у сервера (backend/internal/dedupe) ----

const pick = (main?: string, translation?: string): string =>
  (main || translation || '').trim().toLowerCase();

const normalizedValues = (w: Partial<Word>): string[] =>
  [pick(w.ru, w.translations?.ru), pick(w.en, w.translations?.en), pick(w.ko, w.translations?.ko)]
    .filter(Boolean)
    .sort();

export const isSameWord = (a: Partial<Word>, b: Partial<Word>): boolean => {
  const x = normalizedValues(a);
  const y = normalizedValues(b);
  return x.length >= 2 && x.length === y.length && x.every((v, i) => v === y[i]);
};

const applyPatch = <T extends Partial<Word>>(word: T, patch: Partial<Word>): T => ({
  ...word,
  ...patch,
  id: word.id,
  translations: { ...word.translations, ...(patch.translations ?? {}) },
});

// убираем служебные поля, которые нельзя менять правкой
const cleanPatch = (patch: Partial<Word>): Partial<Word> => {
  const copy: Partial<Word> = { ...patch };
  delete copy.id;
  delete copy.userId;
  delete copy.createdAt;
  return copy;
};

const randomId = (): string =>
  `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

export interface OfflineWordsOptions {
  storage: KeyValueStorage;
  transport: WordsTransport;
  // true — запрос не дошёл до сервера (нет сети, таймаут); такие изменения ждут связи
  isNetworkError: (error: unknown) => boolean;
  cacheKey: string;
  queueKey: string;
  now?: () => Date;
}

export class OfflineWords {
  private readonly o: OfflineWordsOptions;
  private flushing: Promise<boolean> | null = null;
  // все изменения очереди идут строго по одному: чтение-изменение-запись без гонок
  private lock: Promise<unknown> = Promise.resolve();
  private inFlightOpId: string | null = null;

  constructor(options: OfflineWordsOptions) {
    this.o = options;
  }

  private withLock<T>(fn: () => Promise<T>): Promise<T> {
    const run = this.lock.then(fn, fn);
    this.lock = run.catch(() => undefined);
    return run;
  }

  private async snapshot(): Promise<Word[] | null> {
    return this.o.storage.get<Word[]>(this.o.cacheKey);
  }

  private async readQueue(): Promise<QueueState> {
    return (await this.o.storage.get<QueueState>(this.o.queueKey)) ?? { ops: [], idMap: {} };
  }

  private async writeQueue(state: QueueState): Promise<void> {
    const keys = Object.keys(state.idMap);
    if (keys.length > MAX_ID_MAP) {
      for (const key of keys.slice(0, keys.length - MAX_ID_MAP)) {
        delete state.idMap[key];
      }
    }
    if (state.ops.length === 0 && Object.keys(state.idMap).length === 0) {
      await this.o.storage.remove(this.o.queueKey);
    } else {
      await this.o.storage.set(this.o.queueKey, state);
    }
  }

  // Сколько изменений ещё не отправлено на сервер.
  async pendingCount(): Promise<number> {
    return (await this.readQueue()).ops.length;
  }

  private build(base: Word[], ops: Op[]): Word[] {
    let words = [...base];
    for (const op of ops) {
      if (op.kind === 'add') {
        words = [{ id: op.localId, ...op.input, createdAt: op.createdAt }, ...words];
      } else if (op.kind === 'update') {
        words = words.map((w) => (w.id === op.id ? applyPatch(w, op.patch) : w));
      } else {
        words = words.filter((w) => w.id !== op.id);
      }
    }
    return words;
  }

  // view — словарь, каким его видит пользователь: копия с сервера + неотправленные изменения.
  async view(): Promise<Word[]> {
    return this.build((await this.snapshot()) ?? [], (await this.readQueue()).ops);
  }

  add(input: WordInput): Promise<Word> {
    return this.withLock(async () => {
      const state = await this.readQueue();
      const current = this.build((await this.snapshot()) ?? [], state.ops);
      if (current.some((w) => isSameWord(w, input))) {
        throw new DuplicateWordError();
      }
      const op: AddOp = {
        opId: randomId(),
        kind: 'add',
        localId: LOCAL_ID_PREFIX + randomId(),
        input,
        createdAt: (this.o.now?.() ?? new Date()).toISOString(),
      };
      state.ops.push(op);
      await this.writeQueue(state);
      return { id: op.localId, ...input, createdAt: op.createdAt };
    });
  }

  update(id: string, patch: Partial<Word>): Promise<Word> {
    return this.withLock(async () => {
      const state = await this.readQueue();
      const realId = state.idMap[id] ?? id;
      const current = this.build((await this.snapshot()) ?? [], state.ops).find(
        (w) => w.id === realId
      );
      if (!current) {
        throw new WordNotFoundError();
      }
      const clean = cleanPatch(patch);
      const pendingAdd = state.ops.find(
        (op): op is AddOp => op.kind === 'add' && op.localId === realId
      );
      const last = state.ops[state.ops.length - 1];
      if (pendingAdd) {
        // слово ещё не на сервере — меняем его данные прямо в очереди
        // (если оно как раз отправляется, flush заметит разницу и дошлёт правку)
        const { id: _drop, ...input } = applyPatch({ id: realId, ...pendingAdd.input }, clean);
        void _drop;
        pendingAdd.input = input as WordInput;
      } else if (
        last &&
        last.kind === 'update' &&
        last.id === realId &&
        last.opId !== this.inFlightOpId
      ) {
        // несколько правок подряд склеиваем в одну
        last.patch = applyPatch(last.patch, clean);
      } else {
        state.ops.push({ opId: randomId(), kind: 'update', id: realId, patch: clean });
      }
      await this.writeQueue(state);
      return applyPatch(current, clean);
    });
  }

  remove(id: string): Promise<void> {
    return this.withLock(async () => {
      const state = await this.readQueue();
      const realId = state.idMap[id] ?? id;
      const hadPendingAdd = state.ops.some((op) => op.kind === 'add' && op.localId === realId);
      // все неотправленные изменения этого слова больше не нужны
      state.ops = state.ops.filter((op) =>
        op.kind === 'add' ? op.localId !== realId : op.id !== realId
      );
      if (!hadPendingAdd) {
        state.ops.push({ opId: randomId(), kind: 'delete', id: realId });
      }
      await this.writeQueue(state);
    });
  }

  // flush отправляет очередь. true — всё на сервере, false — нет связи, очередь ждёт.
  // Параллельные вызовы ждут один и тот же проход. Свежую копию словаря не берёт — это делает fetch().
  flush(): Promise<boolean> {
    if (!this.flushing) {
      this.flushing = this.doFlush().finally(() => {
        this.flushing = null;
      });
    }
    return this.flushing;
  }

  private async doFlush(): Promise<boolean> {
    for (;;) {
      const op = (await this.readQueue()).ops[0];
      if (!op) {
        break;
      }
      let createdId: string | null = null;
      this.inFlightOpId = op.opId;
      try {
        if (op.kind === 'add') {
          createdId = (await this.o.transport.create({ ...op.input, createdAt: op.createdAt })).id;
        } else if (op.kind === 'update') {
          await this.o.transport.update(op.id, op.patch);
        } else {
          await this.o.transport.remove(op.id);
        }
      } catch (error) {
        if (this.o.isNetworkError(error)) {
          this.inFlightOpId = null;
          return false;
        }
        console.warn('Изменение словаря отклонено сервером и пропущено:', op, error);
      } finally {
        this.inFlightOpId = null;
      }
      await this.withLock(async () => {
        const state = await this.readQueue();
        const index = state.ops.findIndex((o) => o.opId === op.opId);
        if (op.kind === 'add' && createdId) {
          state.idMap[op.localId] = createdId;
          const current = index === -1 ? null : (state.ops[index] as AddOp);
          if (!current) {
            // пока слово отправлялось, его удалили — удаляем и на сервере
            state.ops.push({ opId: randomId(), kind: 'delete', id: createdId });
          } else if (JSON.stringify(current.input) !== JSON.stringify(op.input)) {
            // пока слово отправлялось, его поправили — досылаем правку
            state.ops[index] = {
              opId: randomId(),
              kind: 'update',
              id: createdId,
              patch: current.input,
            };
          } else {
            state.ops.splice(index, 1);
          }
          // правки, сделанные по временному id, переводим на настоящий
          for (const o of state.ops) {
            if (o.kind !== 'add' && o.id === op.localId) {
              o.id = createdId;
            }
          }
        } else if (index !== -1) {
          state.ops.splice(index, 1);
        }
        await this.writeQueue(state);
      });
    }
    return true;
  }

  private async refreshSnapshot(): Promise<boolean> {
    try {
      const words = await this.o.transport.list();
      await this.o.storage.set(this.o.cacheKey, words);
      return true;
    } catch (error) {
      if (!this.o.isNetworkError(error)) {
        throw error;
      }
      return false;
    }
  }

  // fetch — словарь для экрана: отправляет очередь и берёт свежую копию с сервера,
  // а без связи отдаёт сохранённую копию с локальными изменениями.
  async fetch(): Promise<Word[]> {
    const synced = await this.flush();
    if (synced && (await this.refreshSnapshot())) {
      return this.view();
    }
    if ((await this.snapshot()) === null && (await this.pendingCount()) === 0) {
      throw new OfflineNoDataError();
    }
    return this.view();
  }
}
