import { exportFundsToJsonString, importFundsFromBackupContent } from './db';
import {
  downloadSyncGistContent,
  listSyncGists,
  overwriteSyncGist,
} from './gistSync/index';

interface StoredDefaultGistTarget {
  id: string;
  description: string;
  updatedAt: string;
  fileName: string;
}

interface StoredAutoSyncSettings {
  autoGistSync?: boolean;
  gistAutoSyncIntervalMinutes?: number;
  githubToken?: string;
  defaultGistTarget?: StoredDefaultGistTarget | null;
  investmentProfile?: unknown;
}

interface StoredAutoSyncState {
  dirty?: boolean;
  lastAttemptAt?: string;
  lastSuccessAt?: string;
  lastError?: string;
}

export interface AutoGistSyncStatus {
  dirty: boolean;
  lastAttemptAt?: string;
  lastSuccessAt?: string;
  lastError?: string;
  syncing: boolean;
}

const STORAGE_KEY = 'app-settings-preference';
const STATUS_STORAGE_KEY = 'fundManager.gistAutoSyncStatus';
const AUTO_SYNC_DEBOUNCE_MS = 1500;

let debounceTimer: number | null = null;
let inFlight: Promise<void> | null = null;
let pending = false;
let suppressCount = 0;

const STATUS_EVENT = 'fund-manager:gist-auto-sync-status';

const isBrowser = () => typeof window !== 'undefined' && typeof localStorage !== 'undefined';

const readStoredSettings = (): StoredAutoSyncSettings | null => {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAutoSyncSettings;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

const writeStoredSettingsPatch = (patch: Partial<StoredAutoSyncSettings>) => {
  if (!isBrowser()) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...parsed,
        ...patch,
      }),
    );
  } catch {
    // 忽略本地设置写回失败，不影响同步流程
  }
};

const readStoredStatus = (): StoredAutoSyncState => {
  if (!isBrowser()) return {};
  try {
    const raw = localStorage.getItem(STATUS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredAutoSyncState;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeStoredStatusPatch = (patch: Partial<StoredAutoSyncState>) => {
  if (!isBrowser()) return;
  try {
    const current = readStoredStatus();
    localStorage.setItem(
      STATUS_STORAGE_KEY,
      JSON.stringify({
        ...current,
        ...patch,
      }),
    );
  } catch {
    // 忽略状态写入失败，不影响主同步流程
  }
};

const emitStatusChange = () => {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(STATUS_EVENT));
};

const writeAutoSyncStatus = (patch: Partial<StoredAutoSyncState>) => {
  writeStoredStatusPatch(patch);
  emitStatusChange();
};

const writeStoredDefaultTarget = (target: StoredDefaultGistTarget) => {
  writeStoredSettingsPatch({ defaultGistTarget: target });
};

const writeStoredInvestmentProfile = (investmentProfile: unknown) => {
  writeStoredSettingsPatch({ investmentProfile });
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.trim()) return error.message;
  return '自动同步 Gist 失败，请稍后重试。';
};

const markSyncSuccess = (target: StoredDefaultGistTarget) => {
  const now = new Date().toISOString();
  writeStoredDefaultTarget(target);
  writeAutoSyncStatus({
    dirty: false,
    lastAttemptAt: now,
    lastSuccessAt: now,
    lastError: '',
  });
};

const uploadLocalBackup = async (token: string, target: StoredDefaultGistTarget) => {
  const content = await exportFundsToJsonString();
  const result = await overwriteSyncGist({
    token,
    gistId: target.id,
    content,
    description: target.description,
  });

  markSyncSuccess({
    id: result.id,
    description: result.description,
    updatedAt: result.updated_at,
    fileName: target.fileName || 'fund-manager-sync.json',
  });
};

const performAutoSync = async () => {
  const settings = readStoredSettings();
  if (!settings?.autoGistSync) return;

  const token = settings.githubToken?.trim();
  const target = settings.defaultGistTarget;
  if (!token) {
    writeAutoSyncStatus({ lastAttemptAt: new Date().toISOString(), lastError: '请先填写 GitHub Token。' });
    return;
  }

  if (!target?.id) {
    writeAutoSyncStatus({
      lastAttemptAt: new Date().toISOString(),
      lastError: '请先选择或创建默认 Gist 备份。',
    });
    return;
  }

  writeAutoSyncStatus({ lastAttemptAt: new Date().toISOString(), lastError: '' });
  const hasLocalChanges = pending || readStoredStatus().dirty === true;

  if (hasLocalChanges) {
    pending = false;
    await uploadLocalBackup(token, target);
    return;
  }

  const gists = await listSyncGists(token);
  const remoteTarget = gists.find((item) => item.id === target.id);
  if (!remoteTarget) {
    writeAutoSyncStatus({ lastError: '默认 Gist 不存在，请重新选择上传目标。' });
    return;
  }

  const remoteUpdatedAt = new Date(remoteTarget.updated_at).getTime();
  const localUpdatedAt = new Date(target.updatedAt).getTime();
  if (Number.isFinite(remoteUpdatedAt) && Number.isFinite(localUpdatedAt) && remoteUpdatedAt > localUpdatedAt) {
    if (remoteTarget.isBackupValid === false) return;

    const content = await downloadSyncGistContent({ token, gistId: target.id });
    const parsedContent = JSON.parse(content) as { investmentProfile?: unknown };
    await withAutoGistSyncSuppressed(async () => {
      await importFundsFromBackupContent(content, { importMode: 'replaceAll' });
    });

    if (parsedContent.investmentProfile && typeof parsedContent.investmentProfile === 'object') {
      writeStoredInvestmentProfile(parsedContent.investmentProfile);
    }

    markSyncSuccess({
      id: remoteTarget.id,
      description: remoteTarget.description,
      updatedAt: remoteTarget.updated_at,
      fileName: target.fileName || 'fund-manager-sync.json',
    });
    return;
  }

  if (!pending) return;

  await uploadLocalBackup(token, target);
};

export const updateAutoGistTargetSnapshot = (target: StoredDefaultGistTarget | null) => {
  if (!target) return;
  writeStoredDefaultTarget(target);
};

export const markAutoGistSyncUploaded = (target: StoredDefaultGistTarget) => {
  markSyncSuccess(target);
};

const runAutoSync = async () => {
  if (!isBrowser() || suppressCount > 0) return;
  if (inFlight) {
    pending = true;
    return;
  }

  inFlight = (async () => {
    try {
      await performAutoSync();
    } catch (error) {
      console.warn('自动同步 GitHub Gist 失败', error);
      writeAutoSyncStatus({ lastError: getErrorMessage(error) });
    }
  })();

  try {
    await inFlight;
  } finally {
    inFlight = null;
    emitStatusChange();
    if (pending) {
      scheduleAutoGistSync();
    }
  }
};

export const scheduleAutoGistSync = () => {
  if (!isBrowser() || suppressCount > 0) return;
  pending = true;
  writeAutoSyncStatus({ dirty: true, lastError: '' });
  if (debounceTimer !== null) {
    window.clearTimeout(debounceTimer);
  }
  debounceTimer = window.setTimeout(() => {
    debounceTimer = null;
    void runAutoSync();
  }, AUTO_SYNC_DEBOUNCE_MS);
};

export const syncNowWithAutoGist = () => {
  scheduleAutoGistSync();
};

export const syncNowWithAutoGistImmediately = () => {
  if (!isBrowser() || suppressCount > 0) return Promise.resolve();
  pending = true;
  writeAutoSyncStatus({ dirty: true, lastError: '' });
  if (debounceTimer !== null) {
    window.clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  return runAutoSync();
};

export const checkAutoGistSyncNow = () => {
  return runAutoSync();
};

export const getAutoGistSyncStatus = (): AutoGistSyncStatus => {
  const status = readStoredStatus();
  return {
    dirty: status.dirty === true,
    lastAttemptAt: status.lastAttemptAt,
    lastSuccessAt: status.lastSuccessAt,
    lastError: status.lastError || undefined,
    syncing: Boolean(inFlight),
  };
};

export const subscribeAutoGistSyncStatus = (listener: () => void) => {
  if (!isBrowser()) return () => {};
  window.addEventListener(STATUS_EVENT, listener);
  return () => window.removeEventListener(STATUS_EVENT, listener);
};

export const withAutoGistSyncSuppressed = async <T>(fn: () => Promise<T> | T): Promise<T> => {
  suppressCount += 1;
  try {
    return await fn();
  } finally {
    suppressCount = Math.max(0, suppressCount - 1);
  }
};
