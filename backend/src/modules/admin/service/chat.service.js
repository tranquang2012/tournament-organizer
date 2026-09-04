const AppError = require('../../../shared/errors/AppError');
const { SYSTEM_PROMPT } = require('./chat.prompt');

const MAX_TURNS = 8;
const FALLBACK_REPLY = "I couldn't generate a reply. Please try again.";

let skipReasoning = false;

const timeoutMs = () => Number(process.env.AI_TIMEOUT_MS) || 90000;
const maxInputChars = () => Number(process.env.AI_MAX_INPUT_CHARS) || 12000;
const maxOutputTokens = () => Number(process.env.AI_MAX_OUTPUT_TOKENS) || 800;
const aiBaseUrl = () => (process.env.AI_BASE_URL || '').replace(/\/+$/, '');

function filterMessages(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.trim() }))
    .filter((m) => m.content)
    .slice(-MAX_TURNS);
}

function capMessages(messages) {
  const cap = maxInputChars();
  if (!messages.length) {
    throw new AppError('A user message is required.', 400);
  }
  const newest = messages[messages.length - 1];
  if (newest.role !== 'user') {
    throw new AppError('A user message is required.', 400);
  }
  if (newest.content.length > cap) {
    throw new AppError('That message is too long. Shorten it and try again.', 413);
  }

  const kept = [...messages];
  const total = () => kept.reduce((sum, m) => sum + m.content.length, 0);
  while (kept.length > 1 && total() > cap) {
    kept.shift();
  }
  return kept;
}

function extractReply(data) {
  const items = Array.isArray(data?.output) ? data.output : [];
  const texts = [];

  for (const item of items) {
    if (item?.type === 'refusal' && item.refusal) {
      texts.push(item.refusal);
      continue;
    }
    if (item?.type !== 'message' || !Array.isArray(item.content)) continue;
    for (const part of item.content) {
      if (part?.type === 'output_text' && part.text) texts.push(part.text);
      if (part?.type === 'refusal' && (part.refusal || part.text)) {
        texts.push(part.refusal || part.text);
      }
    }
  }

  if (!texts.length && typeof data?.output_text === 'string' && data.output_text.trim()) {
    texts.push(data.output_text);
  }

  let reply = texts.join('\n').trim();
  if (data?.status === 'incomplete' && reply) {
    reply += '\n\n(Reply was cut off.)';
  }
  return reply || FALLBACK_REPLY;
}

function mapVendorStatus(status, json, text) {
  if (status === 401) throw new AppError('AI authentication failed. Check the API key.', 401);
  if (status === 429) throw new AppError('AI is rate limited. Try again in a moment.', 429);
  const code = json?.error?.code || '';
  const vendorMessage = json?.error?.message || '';
  if (code === 'model_not_found' || /no available channel for model/i.test(vendorMessage)) {
    throw new AppError('That AI model is not available on this gateway. Check AI_MODEL.', 502);
  }
  console.warn('AI vendor error', status, code || text.slice(0, 200));
  throw new AppError('AI request failed.', 502);
}

async function postResponses(url, key, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs()),
  });
  const text = await res.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = {};
  }
  return { res, json, text };
}

async function chat(rawMessages) {
  const key = process.env.AI_API_KEY;
  const base = aiBaseUrl();
  if (!key || !base) {
    throw new AppError('AI is not configured.', 503);
  }

  const messages = capMessages(filterMessages(rawMessages));
  const body = {
    model: process.env.AI_MODEL || 'gpt-5.6-sol',
    instructions: SYSTEM_PROMPT,
    input: messages.map((m) => ({ role: m.role, content: m.content })),
    max_output_tokens: maxOutputTokens(),
    store: false,
  };
  if (!skipReasoning) {
    body.reasoning = { effort: process.env.AI_REASONING_EFFORT || 'none' };
  }

  const url = `${base}/responses`;
  const started = Date.now();

  try {
    let { res, json, text } = await postResponses(url, key, body);

    if (res.status === 400 && /reasoning/i.test(text) && !skipReasoning) {
      skipReasoning = true;
      console.warn('AI gateway rejected reasoning; retrying without it.');
      const retryBody = { ...body };
      delete retryBody.reasoning;
      ({ res, json, text } = await postResponses(url, key, retryBody));
    }

    if (!res.ok) mapVendorStatus(res.status, json, text);
    const durationMs = Date.now() - started;
    console.info(`AI chat ${durationMs}ms`);
    return { reply: extractReply(json), durationMs };
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err.name === 'AbortError' || err.name === 'TimeoutError') {
      console.warn(`AI chat timed out after ${Date.now() - started}ms`);
      throw new AppError('AI request timed out.', 504);
    }
    throw new AppError('AI request failed.', 502);
  }
}

module.exports = {
  chat,
  filterMessages,
  capMessages,
  extractReply,
  mapVendorStatus,
};
