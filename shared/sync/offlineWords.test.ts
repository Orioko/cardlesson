// Тесты офлайн-словаря. Запуск: yarn test:shared (node --test, TypeScript без сборки).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Word, WordInput } from '../types/word.ts';
import {
  DuplicateWordError,
  OfflineNoDataError,
  OfflineWords,
  type KeyValueStorage,
  type WordsTransport,
} from './offlineWords.ts';

class MemoryStorage implements KeyValueStorage {
  data = new Map<string, string>();
  async get<T>(key: string): Promise<T | null> {
    const v = this.data.get(key);
    return v === undefined ? null : (JSON.parse(v) as T);
  }
  async set(key: string, value: unknown): Promise<void> {
    this.data.set(key, JSON.stringify(value));
  }
  async remove(key: string): Promise<void> {
    this.data.delete(key);
  }
}

class NetworkError extends Error {}

// Сервер в памяти, с переключателем «есть ли сеть» и задержкой ответа.
class FakeServer implements WordsTransport {
  words: Word[] = [];
  online = true;
  seq = 0;
  calls: string[] = [];
  gate: Promise<void> | null = null;

  private async net(): Promise<void> {
    if (this.gate) {
      await this.gate;
    }
    if (!this.online) {
      throw new NetworkError('offline');
    }
  }
  async list(): Promise<Word[]> {
    await this.net();
    return this.words.map((w) => ({ ...w }));
  }
  async create(input: WordInput & { createdAt?: string }): Promise<Word> {
    await this.net();
    this.calls.push('create');
    const word: Word = { id: `srv_${++this.seq}`, ...input };
    this.words.unshift(word);
    return { ...word };
  }
  async update(id: string, patch: Partial<Word>): Promise<Word> {
    await this.net();
    this.calls.push(`update:${id}`);
    const w = this.words.find((x) => x.id === id);
    if (!w) {
      throw new Error('404');
    }
    Object.assign(w, patch, { translations: { ...w.translations, ...(patch.translations ?? {}) } });
    return { ...w };
  }
  async remove(id: string): Promise<void> {
    await this.net();
    this.calls.push(`delete:${id}`);
    const before = this.words.length;
    this.words = this.words.filter((x) => x.id !== id);
    if (this.words.length === before) {
      throw new Error('404');
    }
  }
}

const word = (ru: string, en: string): WordInput => ({
  ru,
  en,
  ko: '',
  translations: { ru, en, ko: '' },
});

const setup = () => {
  const storage = new MemoryStorage();
  const server = new FakeServer();
  const sync = new OfflineWords({
    storage,
    transport: server,
    isNetworkError: (e) => e instanceof NetworkError,
    cacheKey: 'cache',
    queueKey: 'queue',
  });
  return { storage, server, sync };
};

const names = (words: Word[]) => words.map((w) => w.ru).sort();

describe('OfflineWords', () => {
  it('без связи и без копии — понятная ошибка, а не пустой словарь', async () => {
    const { server, sync } = setup();
    server.online = false;
    await assert.rejects(sync.fetch(), OfflineNoDataError);
  });

  it('добавление, правка и удаление без сети видны сразу и доходят до сервера', async () => {
    const { server, sync } = setup();
    server.words = [{ id: 'srv_a', ...word('Дом', 'House') }];
    await sync.fetch(); // копия с сервера
    server.online = false;

    const cat = await sync.add(word('Кот', 'Cat'));
    await sync.update(cat.id, { en: 'Kitty', translations: { ru: 'Кот', en: 'Kitty', ko: '' } });
    await sync.update('srv_a', { ru: 'Здание' });
    const dog = await sync.add(word('Собака', 'Dog'));
    await sync.remove(dog.id); // так и не дошло до сервера — на сервер не попадёт вовсе

    assert.deepEqual(names(await sync.fetch()), ['Здание', 'Кот']);
    assert.equal(await sync.pendingCount(), 2);
    assert.deepEqual(server.calls, []);

    server.online = true;
    const words = await sync.fetch();
    assert.deepEqual(names(words), ['Здание', 'Кот']);
    assert.ok(
      words.every((w) => w.id.startsWith('srv_')),
      'после синхронизации id настоящие'
    );
    assert.equal(server.words.find((w) => w.ru === 'Кот')?.en, 'Kitty');
    assert.deepEqual(server.calls, ['create', 'update:srv_a']);
    assert.equal(await sync.pendingCount(), 0);
  });

  it('дубль ловится локально, как на сервере', async () => {
    const { sync } = setup();
    await sync.fetch();
    await sync.add(word('Кот', 'Cat'));
    await assert.rejects(sync.add(word('cat', ' КОТ ')), DuplicateWordError);
  });

  it('изменение, отвергнутое сервером, отбрасывается и не блокирует очередь', async () => {
    const { server, sync } = setup();
    server.words = [{ id: 'srv_a', ...word('Дом', 'House') }];
    await sync.fetch();
    server.online = false;
    await sync.update('srv_a', { ru: 'Здание' });
    await sync.add(word('Кот', 'Cat'));
    server.words = []; // слово удалили с другого устройства
    server.online = true;
    const words = await sync.fetch();
    assert.deepEqual(names(words), ['Кот']);
    assert.equal(await sync.pendingCount(), 0);
  });

  it('связь пропала посреди отправки — остаток очереди ждёт, порядок сохраняется', async () => {
    const { server, sync } = setup();
    await sync.fetch();
    server.online = false;
    await sync.add(word('А', 'A'));
    await sync.add(word('Б', 'B'));
    server.online = true;
    const origCreate = server.create.bind(server);
    let n = 0;
    server.create = async (input) => {
      if (++n === 2) {
        server.online = false;
      }
      return origCreate(input);
    };
    assert.equal(await sync.flush(), false);
    assert.equal(await sync.pendingCount(), 1);
    server.online = true;
    await sync.fetch();
    assert.deepEqual(names(server.words), ['А', 'Б']);
  });

  it('правка слова, которое прямо сейчас отправляется, не теряется', async () => {
    const { server, sync } = setup();
    await sync.fetch();
    server.online = false;
    const cat = await sync.add(word('Кот', 'Cat'));
    server.online = true;
    let release!: () => void;
    server.gate = new Promise<void>((r) => (release = r));
    const flushing = sync.flush(); // запрос «создать» висит на gate
    await new Promise((r) => setTimeout(r, 5));
    await sync.update(cat.id, { en: 'Kitty' }); // правка во время отправки
    server.gate = null;
    release();
    await flushing;
    await sync.fetch();
    assert.equal(server.words[0].en, 'Kitty');
  });

  it('удаление слова, которое прямо сейчас отправляется, удаляет его и на сервере', async () => {
    const { server, sync } = setup();
    await sync.fetch();
    server.online = false;
    const cat = await sync.add(word('Кот', 'Cat'));
    server.online = true;
    let release!: () => void;
    server.gate = new Promise<void>((r) => (release = r));
    const flushing = sync.flush();
    await new Promise((r) => setTimeout(r, 5));
    await sync.remove(cat.id);
    server.gate = null;
    release();
    await flushing;
    await sync.fetch();
    assert.deepEqual(server.words, []);
  });

  it('экран со старым временным id после синхронизации правит нужное слово', async () => {
    const { server, sync } = setup();
    await sync.fetch();
    server.online = false;
    const cat = await sync.add(word('Кот', 'Cat'));
    server.online = true;
    await sync.fetch();
    await sync.update(cat.id, { en: 'Kitty' }); // id ещё временный, как его запомнил экран
    await sync.fetch();
    assert.equal(server.words[0].en, 'Kitty');
    assert.equal(server.words.length, 1);
  });

  it('несколько правок подряд отправляются одним запросом', async () => {
    const { server, sync } = setup();
    server.words = [{ id: 'srv_a', ...word('Дом', 'House') }];
    await sync.fetch();
    server.online = false;
    await sync.update('srv_a', { en: 'Home' });
    await sync.update('srv_a', { ko: '집' });
    assert.equal(await sync.pendingCount(), 1);
    server.online = true;
    await sync.fetch();
    assert.deepEqual(server.calls, ['update:srv_a']);
    assert.equal(server.words[0].en, 'Home');
    assert.equal(server.words[0].ko, '집');
  });
});
