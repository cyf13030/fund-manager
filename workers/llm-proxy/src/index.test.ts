/// <reference types="vitest/globals" />

import worker from './index';

const env = {
  LLM_PROXY_ALLOWED_HOSTS: 'api.example.com',
  LLM_PROXY_ALLOWED_ORIGINS: 'https://cyf13030.github.io,https://gp.hrfuqiang.top',
};

describe('llm proxy worker', () => {
  it('允许配置来源的 CORS 预检请求', async () => {
    const response = await worker.fetch(
      new Request('https://gp.hrfuqiang.top/llm-proxy/chat/completions', {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://cyf13030.github.io',
          'Access-Control-Request-Headers': 'authorization,content-type,x-llm-target-base-url',
        },
      }),
      env,
    );

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://cyf13030.github.io');
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('authorization');
  });

  it('转发请求并保留 CORS 响应头', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await worker.fetch(
      new Request('https://gp.hrfuqiang.top/llm-proxy/chat/completions', {
        method: 'POST',
        headers: {
          Origin: 'https://cyf13030.github.io',
          Authorization: 'Bearer token',
          'Content-Type': 'application/json',
          'X-LLM-Target-Base-URL': 'https://api.example.com/v1',
        },
        body: JSON.stringify({ model: 'test-model' }),
      }),
      env,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://cyf13030.github.io');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/v1/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('拒绝未允许的上游主机', async () => {
    const response = await worker.fetch(
      new Request('https://gp.hrfuqiang.top/llm-proxy/chat/completions', {
        method: 'POST',
        headers: {
          Origin: 'https://cyf13030.github.io',
          'X-LLM-Target-Base-URL': 'https://evil.example.com/v1',
        },
      }),
      env,
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({ error: 'LLM_PROXY_HOST_NOT_ALLOWED' });
  });
});
