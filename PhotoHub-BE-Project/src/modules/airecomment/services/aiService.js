const crypto = require("crypto");

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_CHAT_MODEL = process.env.GROQ_CHAT_MODEL || "llama-3.3-70b-versatile";
const GROQ_VISION_MODEL = process.env.GROQ_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const VECTOR_SIZE = 512;

const stopwords = new Set([
  "a", "an", "the", "and", "or", "to", "of", "in", "on", "with", "for", "by", "from",
  "is", "are", "was", "were", "be", "been", "this", "that", "these", "those", "it",
  "photo", "image", "picture", "ảnh", "hinh", "hình", "một", "mot", "the", "and",
]);

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value) {
  return normalizeText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token && token.length > 1 && !stopwords.has(token));
}

function normalizeVector(vector) {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (!magnitude) return vector;
  return vector.map((value) => Number((value / magnitude).toFixed(8)));
}

function hashToken(token) {
  const digest = crypto.createHash("sha256").update(token).digest();
  return digest.readUInt32BE(0);
}

function vectorFromText(text) {
  const vector = new Array(VECTOR_SIZE).fill(0);
  const tokens = tokenize(text);

  if (!tokens.length) {
    return vector;
  }

  tokens.forEach((token, index) => {
    const hash = hashToken(`${token}:${index % 7}`);
    const bucket = hash % VECTOR_SIZE;
    const sign = hash % 2 === 0 ? 1 : -1;
    vector[bucket] += sign * (1 + (token.length % 5) * 0.2);
  });

  return normalizeVector(vector);
}

function vectorFromBuffer(buffer) {
  const vector = new Array(VECTOR_SIZE).fill(0);
  const digest = crypto.createHash("sha256").update(buffer).digest();

  for (let i = 0; i < VECTOR_SIZE; i += 1) {
    const byte = digest[i % digest.length];
    vector[i] = (byte / 127.5) - 1;
  }

  return normalizeVector(vector);
}

function parseJsonLike(rawText) {
  if (!rawText) return null;
  const cleaned = String(rawText)
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");

  try {
    return JSON.parse(cleaned);
  } catch (_error) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch (_nestedError) {
      return null;
    }
  }
}

async function groqChatCompletion({
  messages,
  model = GROQ_CHAT_MODEL,
  temperature = 0.4,
  maxTokens = 700,
  responseFormat = undefined,
}) {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing");
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      ...(responseFormat ? { response_format: responseFormat } : {}),
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message || payload?.message || `Groq request failed with status ${response.status}`);
  }

  const content = payload?.choices?.[0]?.message?.content;
  return {
    content: typeof content === "string" ? content : JSON.stringify(content || {}),
    raw: payload,
  };
}

async function analyzeImageWithGroq(imageBuffer, mimeType) {
  const dataUrl = `data:${mimeType || "image/jpeg"};base64,${imageBuffer.toString("base64")}`;
  const prompt = [
    {
      role: "system",
      content:
        "You are an image analyst for a photography marketplace. Return ONLY valid JSON with keys: caption, summary, styleTags, subjects, colors, mood, setting, qualitySignals. Keep it concise and descriptive. Avoid markdown.",
    },
    {
      role: "user",
      content: [
        { type: "text", text: "Analyze this image for style matching and portfolio search." },
        {
          type: "image_url",
          image_url: {
            url: dataUrl,
          },
        },
      ],
    },
  ];

  const { content } = await groqChatCompletion({
    messages: prompt,
    model: GROQ_VISION_MODEL,
    temperature: 0.15,
    maxTokens: 500,
  });

  return parseJsonLike(content) || {
    caption: content,
    summary: content,
    styleTags: [],
    subjects: [],
    colors: [],
    mood: "",
    setting: "",
    qualitySignals: [],
  };
}

async function generateEmbedding(imageBuffer, mimeType) {
  if (!imageBuffer || imageBuffer.length === 0) {
    throw new Error("imageBuffer is required");
  }

  try {
    if (!GROQ_API_KEY) {
      return vectorFromBuffer(imageBuffer);
    }

    const analysis = await analyzeImageWithGroq(imageBuffer, mimeType);
    const descriptor = [
      analysis.caption,
      analysis.summary,
      ...(Array.isArray(analysis.styleTags) ? analysis.styleTags : []),
      ...(Array.isArray(analysis.subjects) ? analysis.subjects : []),
      ...(Array.isArray(analysis.colors) ? analysis.colors : []),
      analysis.mood,
      analysis.setting,
      ...(Array.isArray(analysis.qualitySignals) ? analysis.qualitySignals : []),
    ]
      .filter(Boolean)
      .join(" ");

    return descriptor ? vectorFromText(descriptor) : vectorFromBuffer(imageBuffer);
  } catch (error) {
    console.warn("[Groq AI] Falling back to deterministic vector:", error.message);
    return vectorFromBuffer(imageBuffer);
  }
}

async function chatWithGroq({
  messages = [],
  systemPrompt = "You are a helpful assistant.",
  model = GROQ_CHAT_MODEL,
  temperature = 0.45,
  maxTokens = 700,
} = {}) {
  const sanitizedMessages = Array.isArray(messages)
    ? messages
        .filter((message) => message && typeof message.content === "string")
        .map((message) => ({
          role: ["system", "assistant", "user"].includes(message.role) ? message.role : "user",
          content: message.content,
        }))
    : [];

  const { content, raw } = await groqChatCompletion({
    model,
    temperature,
    maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      ...sanitizedMessages.filter((message) => message.role !== "system"),
    ],
  });

  return {
    reply: content,
    model: raw?.model || model,
    raw,
  };
}

async function warmupModel() {
  if (!GROQ_API_KEY) {
    console.warn("[Groq AI] GROQ_API_KEY is not configured; AI features will use fallback vectors only.");
    return;
  }

  try {
    await groqChatCompletion({
      model: GROQ_CHAT_MODEL,
      temperature: 0,
      maxTokens: 8,
      messages: [
        {
          role: "user",
          content: "Reply with OK to confirm the Groq connection is ready.",
        },
      ],
    });
    console.log("[Groq AI] Groq warm-up completed");
  } catch (error) {
    console.warn("[Groq AI] Warm-up failed:", error.message);
  }
}

module.exports = {
  generateEmbedding,
  warmupModel,
  chatWithGroq,
};
