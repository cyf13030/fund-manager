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

const STORAGE_KEY = 'app-settings-preference';
const AUTO_SYNC_DEBOUNCE_MS = 1500;

let debounceTimer: number | null = null;
let inFlight: Promise<void> | null = null;
let pending = false;
let suppressCount = 0;

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

const writeStoredDefaultTarget = (target: StoredDefaultGistTarget) => {
  writeStoredSettingsPatch({ defaultGistTarget: target });
};

const writeStoredInvestmentProfile = (investmentProfile: unknown) => {
  writeStoredSettingsPatch({ investmentProfile });
};

const shouldAutoSync = () => {
  const settings = readStoredSettings();
  if (!settings) return false;
  if (!settings.autoGistSync) return false;
  if (!settings.githubToken?.trim()) return false;
  if (!settings.defaultGistTarget?.id) return false;
  return true;
};

const performAutoSync = async () => {
  if (!shouldAutoSync()) return;

  const settings = readStoredSettings();
  const token = settings?.githubToken?.trim();
  const target = settings?.defaultGistTarget;
  if (!token || !target?.id) return;

  if (pending) {
    pending = false;

    const content = await exportFundsToJsonString();
    const result = await overwriteSyncGist({
      token,
      gistId: target.id,
      content,
      description: target.description,
    });

    writeStoredDefaultTarget({
      id: result.id,
      description: result.description,
      updatedAt: result.updated_at,
      fileName: target.fileName || 'fund-manager-sync.json',
    });

    return;
  }

  const gists = await listSyncGists(token);
  const remoteTarget = gists.find((item) => item.id === target.id);
  if (!remoteTarget) return;

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

    writeStoredDefaultTarget({
      id: remoteTarget.id,
      description: remoteTarget.description,
      updatedAt: remoteTarget.updated_at,
      fileName: target.fileName || 'fund-manager-sync.json',
    });
    return;
  }

  if (!pending) return;

  const content = await exportFundsToJsonString();
  const result = await overwriteSyncGist({
    token,
    gistId: target.id,
    content,
    description: target.description,
  });

  writeStoredDefaultTarget({
    id: result.id,
    description: result.description,
    updatedAt: result.updated_at,
    fileName: target.fileName || 'fund-manager-sync.json',
  });
};

export const updateAutoGistTargetSnapshot = (target: StoredDefaultGistTarget | null) => {
  if (!target) return;
  writeStoredDefaultTarget(target);
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
    }
  })();

  try {
    await inFlight;
  } finally {
    inFlight = null;
    if (pending) {
      scheduleAutoGistSync();
    }
  }
};

export const scheduleAutoGistSync = () => {
  if (!isBrowser() || suppressCount > 0) return;
  pending = true;
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

export const checkAutoGistSyncNow = () => {
  return runAutoSync();
};

export const withAutoGistSyncSuppressed = async <T>(fn: () => Promise<T> | T): Promise<T> => {
  suppressCount += 1;
  try {
    return await fn();
  } finally {
    suppressCount = Math.max(0, suppressCount - 1);
  }
};
