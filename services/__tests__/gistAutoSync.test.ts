import { afterEach, describe, expect, it, vi } from 'vitest';

const mockedDeps = vi.hoisted(() => ({
  exportFundsToJsonString: vi.fn(),
  importFundsFromBackupContent: vi.fn(),
  listSyncGists: vi.fn(),
  downloadSyncGistContent: vi.fn(),
  overwriteSyncGist: vi.fn(),
}));

vi.mock('../db', () => ({
  exportFundsToJsonString: mockedDeps.exportFundsToJsonString,
  importFundsFromBackupContent: mockedDeps.importFundsFromBackupContent,
}));

vi.mock('../gistSync/index', () => ({
  listSyncGists: mockedDeps.listSyncGists,
  downloadSyncGistContent: mockedDeps.downloadSyncGistContent,
  overwriteSyncGist: mockedDeps.overwriteSyncGist,
}));

import {
  checkAutoGistSyncNow,
  getAutoGistSyncStatus,
  syncNowWithAutoGist,
  updateAutoGistTargetSnapshot,
  withAutoGistSyncSuppressed,
} from '../gistAutoSync';

describe('gistAutoSync', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('debounces and syncs once with stored target', async () => {
    vi.useFakeTimers();
    localStorage.setItem(
      'app-settings-preference',
      JSON.stringify({
        autoGistSync: true,
        githubToken: 'ghp_testtoken1234567890',
        defaultGistTarget: {
          id: 'gist-1',
          description: '默认备份',
          updatedAt: '2026-03-20T00:00:00Z',
          fileName: 'fund-manager-sync.json',
        },
      }),
    );
    mockedDeps.exportFundsToJsonString.mockResolvedValue('{"version":1}');
    mockedDeps.overwriteSyncGist.mockResolvedValue({
      id: 'gist-1',
      description: '默认备份',
      updated_at: '2026-03-21T00:00:00Z',
      hasSyncFile: true,
      files: {},
    });

    syncNowWithAutoGist();
    syncNowWithAutoGist();
    await vi.advanceTimersByTimeAsync(1500);

    expect(mockedDeps.exportFundsToJsonString).toHaveBeenCalledTimes(1);
    expect(mockedDeps.overwriteSyncGist).toHaveBeenCalledTimes(1);
    expect(mockedDeps.overwriteSyncGist).toHaveBeenCalledWith({
      token: 'ghp_testtoken1234567890',
      gistId: 'gist-1',
      content: '{"version":1}',
      description: '默认备份',
    });
    expect(getAutoGistSyncStatus()).toMatchObject({
      dirty: false,
      lastError: undefined,
    });
  });

  it('uploads persisted dirty changes on app startup check', async () => {
    localStorage.setItem(
      'app-settings-preference',
      JSON.stringify({
        autoGistSync: true,
        githubToken: 'ghp_testtoken1234567890',
        gistAutoSyncDirty: true,
        defaultGistTarget: {
          id: 'gist-1',
          description: '默认备份',
          updatedAt: '2026-03-20T00:00:00Z',
          fileName: 'fund-manager-sync.json',
        },
      }),
    );
    mockedDeps.exportFundsToJsonString.mockResolvedValue('{"version":1}');
    mockedDeps.overwriteSyncGist.mockResolvedValue({
      id: 'gist-1',
      description: '默认备份',
      updated_at: '2026-03-21T00:00:00Z',
      hasSyncFile: true,
      files: {},
    });

    await checkAutoGistSyncNow();

    expect(mockedDeps.exportFundsToJsonString).toHaveBeenCalledTimes(1);
    expect(mockedDeps.overwriteSyncGist).toHaveBeenCalledTimes(1);
    expect(getAutoGistSyncStatus().dirty).toBe(false);
  });

  it('records visible error when auto sync lacks default target', async () => {
    localStorage.setItem(
      'app-settings-preference',
      JSON.stringify({
        autoGistSync: true,
        githubToken: 'ghp_testtoken1234567890',
      }),
    );

    await checkAutoGistSyncNow();

    expect(mockedDeps.exportFundsToJsonString).not.toHaveBeenCalled();
    expect(getAutoGistSyncStatus().lastError).toBe('请先选择或创建默认 Gist 备份。');
  });

  it('checks remote gist and imports newer content immediately', async () => {
    localStorage.setItem(
      'app-settings-preference',
      JSON.stringify({
        autoGistSync: true,
        githubToken: 'ghp_testtoken1234567890',
        defaultGistTarget: {
          id: 'gist-1',
          description: '默认备份',
          updatedAt: '2026-03-20T00:00:00Z',
          fileName: 'fund-manager-sync.json',
        },
      }),
    );
    mockedDeps.listSyncGists.mockResolvedValue([
      {
        id: 'gist-1',
        description: '默认备份',
        updated_at: '2026-03-21T00:00:00Z',
        hasSyncFile: true,
        isBackupValid: true,
        fileName: 'fund-manager-sync.json',
      },
    ]);
    mockedDeps.downloadSyncGistContent.mockResolvedValue('{"version":2}');
    mockedDeps.importFundsFromBackupContent.mockResolvedValue({ added: 1, skipped: 0 });

    await checkAutoGistSyncNow();

    expect(mockedDeps.listSyncGists).toHaveBeenCalledWith('ghp_testtoken1234567890');
    expect(mockedDeps.downloadSyncGistContent).toHaveBeenCalledWith({
      token: 'ghp_testtoken1234567890',
      gistId: 'gist-1',
    });
    expect(mockedDeps.importFundsFromBackupContent).toHaveBeenCalledWith('{"version":2}', {
      importMode: 'replaceAll',
    });
  });

  it('skips sync while suppressed', async () => {
    vi.useFakeTimers();
    localStorage.setItem(
      'app-settings-preference',
      JSON.stringify({
        autoGistSync: true,
        githubToken: 'ghp_testtoken1234567890',
        defaultGistTarget: {
          id: 'gist-1',
          description: '默认备份',
          updatedAt: '2026-03-20T00:00:00Z',
          fileName: 'fund-manager-sync.json',
        },
      }),
    );
    mockedDeps.exportFundsToJsonString.mockResolvedValue('{"version":1}');
    mockedDeps.overwriteSyncGist.mockResolvedValue({
      id: 'gist-1',
      description: '默认备份',
      updated_at: '2026-03-21T00:00:00Z',
      hasSyncFile: true,
      files: {},
    });

    await withAutoGistSyncSuppressed(async () => {
      syncNowWithAutoGist();
      await vi.advanceTimersByTimeAsync(1500);
    });

    expect(mockedDeps.exportFundsToJsonString).not.toHaveBeenCalled();
    expect(mockedDeps.overwriteSyncGist).not.toHaveBeenCalled();
  });

  it('updates stored target snapshot', () => {
    localStorage.setItem('app-settings-preference', JSON.stringify({ autoGistSync: false }));

    updateAutoGistTargetSnapshot({
      id: 'gist-2',
      description: '新目标',
      updatedAt: '2026-03-22T00:00:00Z',
      fileName: 'fund-manager-sync.json',
    });

    const stored = JSON.parse(localStorage.getItem('app-settings-preference') || '{}') as {
      defaultGistTarget?: { id: string; description: string; updatedAt: string; fileName: string };
    };
    expect(stored.defaultGistTarget?.id).toBe('gist-2');
  });
});
