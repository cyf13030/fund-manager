export const getLlmProxyBaseUrl = (configuredUrl?: string) => {
  const envUrl =
    configuredUrl ??
    (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_LLM_PROXY_BASE_URL : '') ??
    '';
  const normalizedEnvUrl = envUrl.trim().replace(/\/+$/, '');
  if (normalizedEnvUrl) return normalizedEnvUrl;

  const origin =
    typeof window !== 'undefined' && typeof window.location?.origin === 'string'
      ? window.location.origin
      : 'http://localhost';
  return `${origin.replace(/\/+$/, '')}/llm-proxy`;
};
