let runtimeSalt: string | null = null;

export const getRuntimeRandomSalt = (): string => {
  if (runtimeSalt) {
    return runtimeSalt;
  }

  try {
    const cryptoObj = globalThis.crypto;
    if (cryptoObj && 'getRandomValues' in cryptoObj) {
      const arr = new Uint32Array(2);
      cryptoObj.getRandomValues(arr);
      runtimeSalt = `${arr[0].toString(16)}_${arr[1].toString(16)}`;
      return runtimeSalt;
    }
  } catch {
    runtimeSalt = null;
  }

  runtimeSalt = `${Date.now()}_${Math.floor(Math.random() * 1_000_000_000)}`;
  return runtimeSalt;
};

export const hashStringToUint32 = (input: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

export const createMulberry32 = (seed: number): (() => number) => {
  let t = seed >>> 0;

  return (): number => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const scopeCounters = new Map<string, number>();

export const createEphemeralRng = (scope: string): (() => number) => {
  const prev = scopeCounters.get(scope) ?? 0;
  const next = prev + 1;
  scopeCounters.set(scope, next);

  const seed = hashStringToUint32(`${getRuntimeRandomSalt()}_${scope}_${next}`);
  return createMulberry32(seed);
};
