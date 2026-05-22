import { GoogleGenerativeAI } from '@google/generative-ai';

import type { AiRuntimeConfig } from './aiProviderConfig';
import { getLlmProxyBaseUrl } from './llmProxy';
import type { QuantAnalysisResponse } from './quantAnalysis';

const OPENAI_BASE_URL = 'https://api.openai.com/v1';
const QUANT_INTERPRETATION_STORAGE_KEY = 'fundManager.quantInterpretationCache.v1';

interface CacheEntry {
  key: string;
  value: string;
}

interface OpenAiCompatibleResponse {
  choices?: Array<{ message?: { content?: unknown } }>;
  error?: { message?: unknown } | string;
  message?: unknown;
}

const buildCacheKey = (analysis: QuantAnalysisResponse, runtime: AiRuntimeConfig) =>
  JSON.stringify({ generatedAt: analysis.generatedAt, provider: runtime.provider, model: runtime.model });

export const buildQuantInterpretationPrompt = (analysis: QuantAnalysisResponse) => `你是一位基金组合量化分析解释助手。

要求：
1) 只能解释“量化结构化数据”中的字段，不得新增、不猜测、不修正任何数值。
2) 缺失字段必须说明“缺失”，不能补全。
3) 估值只能表述为“历史净值位置 proxy”，不得说成真实 PE/PB、便宜或昂贵。
4) 不得写“必涨”“必跌”“一定”，不得做确定性预测。
5) 操作表达只能是条件化倾向，例如“继续持有观察”“谨慎追涨”“等待回撤确认”“降低单一主题暴露”。
6) 不推荐未出现在数据里的基金、股票或代码。
7) 输出适合前端阅读，控制在 900 字以内。

请按以下结构输出：
一、组合结论
二、量化强项
三、主要风险
四、基金分层
五、操作倾向
六、数据限制

量化结构化数据：
${JSON.stringify(analysis)}`;

const readCache = (key: string) => {
  try {
    const raw = localStorage.getItem(QUANT_INTERPRETATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CacheEntry>;
    if (parsed.key !== key || typeof parsed.value !== 'string') return null;
    return parsed.value;
  } catch {
    return null;
  }
};

const writeCache = (entry: CacheEntry) => {
  try {
    localStorage.setItem(QUANT_INTERPRETATION_STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // ignore storage errors
  }
};

const extractOpenAiContent = (response: unknown) => {
  const content = (response as { choices?: Array<{ message?: { content?: unknown } }> })?.choices?.[0]?.message
    ?.content;
  if (typeof content === 'string') return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === 'object' && part && 'text' in part ? String(part.text || '') : ''))
      .join('')
      .trim();
  }
  return '';
};

const buildProxyTargetHeaders = (apiKey: string, targetBaseUrl: string) => ({
  Authorization: `Bearer ${apiKey}`,
  'Content-Type': 'application/json',
  'X-LLM-Target-Base-URL': targetBaseUrl,
});

const extractErrorMessage = (payload: OpenAiCompatibleResponse | null, fallback: string) => {
  if (!payload) return fallback;
  if (typeof payload.error === 'string') return payload.error;
  if (payload.error?.message) return String(payload.error.message);
  if (payload.message) return String(payload.message);
  return fallback;
};

export const clearQuantInterpretationCache = () => {
  try {
    localStorage.removeItem(QUANT_INTERPRETATION_STORAGE_KEY);
  } catch {
    // ignore
  }
};

export const interpretQuantAnalysis = async (
  analysis: QuantAnalysisResponse,
  runtime: AiRuntimeConfig,
  options?: { force?: boolean },
): Promise<string> => {
  if (!runtime.apiKey) throw new Error('MISSING_API_KEY');
  if (!runtime.model) throw new Error('MISSING_MODEL');

  const cacheKey = buildCacheKey(analysis, runtime);
  if (!options?.force) {
    const cached = readCache(cacheKey);
    if (cached) return cached;
  }

  const systemPrompt = buildQuantInterpretationPrompt(analysis);
  const question = '请基于量化结构化数据做解释，严格遵守系统要求。';
  let answer = '';

  if (runtime.provider === 'gemini') {
    const gemini = new GoogleGenerativeAI(runtime.apiKey);
    const model = gemini.getGenerativeModel({ model: runtime.model, systemInstruction: systemPrompt });
    const result = await model.generateContent(question);
    answer = result.response.text().trim();
  } else {
    const targetBaseUrl = runtime.provider === 'openai' ? OPENAI_BASE_URL : runtime.baseURL?.trim() || '';
    if (!targetBaseUrl) throw new Error('MISSING_BASE_URL');

    const response = await fetch(`${getLlmProxyBaseUrl()}/chat/completions`, {
      method: 'POST',
      headers: buildProxyTargetHeaders(runtime.apiKey, targetBaseUrl),
      body: JSON.stringify({
        model: runtime.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
        temperature: runtime.temperature ?? 0.2,
      }),
    });

    const payload = (await response.json().catch(() => null)) as OpenAiCompatibleResponse | null;
    if (!response.ok) {
      throw new Error(extractErrorMessage(payload, `LLM_PROXY_REQUEST_FAILED_${response.status}`));
    }
    answer = extractOpenAiContent(payload);
  }

  if (!answer) throw new Error('EMPTY_LLM_CONTENT');
  writeCache({ key: cacheKey, value: answer });
  return answer;
};
