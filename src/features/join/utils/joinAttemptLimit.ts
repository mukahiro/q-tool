export const MAX_FAILED_JOIN_ATTEMPTS = 5;
export const JOIN_LOCK_DURATION_MS = 5 * 60 * 1000;

const JOIN_ATTEMPT_STORAGE_KEY = "q_tool_join_attempt_limit";

type StoredJoinAttemptLimit = {
  failedAttempts: number;
  lockedUntil: number | null;
};

export type JoinAttemptStatus = {
  failedAttempts: number;
  remainingAttempts: number;
  locked: boolean;
  lockedUntil: number | null;
  remainingMs: number;
};

const EMPTY_STATUS: JoinAttemptStatus = {
  failedAttempts: 0,
  remainingAttempts: MAX_FAILED_JOIN_ATTEMPTS,
  locked: false,
  lockedUntil: null,
  remainingMs: 0,
};

export function getJoinAttemptStatus(
  now = Date.now(),
): JoinAttemptStatus {
  const storage = getStorage();

  if (!storage) {
    return EMPTY_STATUS;
  }

  const storedValue = storage.getItem(JOIN_ATTEMPT_STORAGE_KEY);

  if (!storedValue) {
    return EMPTY_STATUS;
  }

  try {
    const parsed = JSON.parse(
      storedValue,
    ) as Partial<StoredJoinAttemptLimit>;

    const failedAttempts =
      typeof parsed.failedAttempts === "number" &&
      Number.isFinite(parsed.failedAttempts)
        ? Math.max(0, Math.floor(parsed.failedAttempts))
        : 0;

    const lockedUntil =
      typeof parsed.lockedUntil === "number" &&
      Number.isFinite(parsed.lockedUntil)
        ? parsed.lockedUntil
        : null;

    if (lockedUntil !== null && lockedUntil <= now) {
      storage.removeItem(JOIN_ATTEMPT_STORAGE_KEY);
      return EMPTY_STATUS;
    }

    const locked = lockedUntil !== null && lockedUntil > now;

    return {
      failedAttempts,
      remainingAttempts: Math.max(
        0,
        MAX_FAILED_JOIN_ATTEMPTS - failedAttempts,
      ),
      locked,
      lockedUntil,
      remainingMs: lockedUntil
        ? Math.max(0, lockedUntil - now)
        : 0,
    };
  } catch {
    storage.removeItem(JOIN_ATTEMPT_STORAGE_KEY);
    return EMPTY_STATUS;
  }
}

export function recordFailedJoinAttempt(
  now = Date.now(),
): JoinAttemptStatus {
  const storage = getStorage();
  const currentStatus = getJoinAttemptStatus(now);

  if (!storage || currentStatus.locked) {
    return currentStatus;
  }

  const failedAttempts = currentStatus.failedAttempts + 1;
  const lockedUntil =
    failedAttempts >= MAX_FAILED_JOIN_ATTEMPTS
      ? now + JOIN_LOCK_DURATION_MS
      : null;

  const newValue: StoredJoinAttemptLimit = {
    failedAttempts,
    lockedUntil,
  };

  storage.setItem(
    JOIN_ATTEMPT_STORAGE_KEY,
    JSON.stringify(newValue),
  );

  return getJoinAttemptStatus(now);
}

export function clearJoinAttemptLimit() {
  getStorage()?.removeItem(JOIN_ATTEMPT_STORAGE_KEY);
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}