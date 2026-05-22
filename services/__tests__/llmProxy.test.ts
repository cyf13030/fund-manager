import { describe, expect, it } from 'vitest';
import { getLlmProxyBaseUrl } from '../llmProxy';

describe('getLlmProxyBaseUrl', () => {
  it('应返回绝对同源代理地址', () => {
    const url = getLlmProxyBaseUrl();
    expect(url.startsWith('http://') || url.startsWith('https://')).toBe(true);
    expect(url.endsWith('/llm-proxy')).toBe(true);
  });

  it('配置代理地址时优先使用配置值并移除末尾斜杠', () => {
    expect(getLlmProxyBaseUrl('https://gp.hrfuqiang.top/llm-proxy/')).toBe(
      'https://gp.hrfuqiang.top/llm-proxy',
    );
  });
});
