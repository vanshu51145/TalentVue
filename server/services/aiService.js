const isUsableKey = (key) => {
  if (!key) return false;

  const value = String(key).trim();

  return (
    value.length > 20 &&
    !value.startsWith("replace-with-")
  );
};

const getProviders = () => [
  {
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    url: "https://api.groq.com/openai/v1/chat/completions",
    key: process.env.GROQ_API_KEY,
    model:
      process.env.GROQ_MODEL ||
      "openai/gpt-oss-20b",
    transcriptionModel:
      process.env.GROQ_TRANSCRIBE_MODEL ||
      "whisper-large-v3-turbo",
  },
  {
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    url: "https://api.openai.com/v1/chat/completions",
    key: process.env.OPENAI_API_KEY,
    model:
      process.env.OPENAI_MODEL ||
      "gpt-4o-mini",
    transcriptionModel:
      process.env.OPENAI_TRANSCRIBE_MODEL ||
      "whisper-1",
  },
];

const getProvider = () =>
  getProviders().find((item) =>
    isUsableKey(item.key)
  );

const serviceError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const requestCompletion = async ({
  messages,
  maxTokens = 1000,
  temperature = 0.4,
}) => {
  const provider = getProvider();

  if (!provider) {
    throw serviceError(
      "AI service is not configured. Set GROQ_API_KEY (free) or OPENAI_API_KEY on the server.",
      503
    );
  }

  let response;

  try {
    response = await fetch(
      provider.url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${String(
            provider.key
          ).trim()}`,
        },
        body: JSON.stringify({
          model: provider.model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      }
    );
  } catch {
    throw serviceError(
      "AI service is unavailable right now. Please try again.",
      502
    );
  }

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    console.error(
      `${provider.name.toUpperCase()} CHAT ERROR:`,
      response.status,
      data
    );

    throw serviceError(
      "AI service is unavailable right now. Please try again.",
      502
    );
  }

  const content =
    data &&
    data.choices &&
    data.choices[0] &&
    data.choices[0].message &&
    data.choices[0].message.content;

  if (!content) {
    throw serviceError(
      "AI service returned an empty response.",
      502
    );
  }

  return String(content).trim();
};

const parseJsonContent = (content) => {
  const cleaned = String(content)
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw serviceError(
      "AI service returned an invalid JSON format.",
      502
    );
  }

  try {
    return JSON.parse(
      cleaned.slice(start, end + 1)
    );
  } catch {
    throw serviceError(
      "AI service returned an invalid JSON format.",
      502
    );
  }
};

const requestJson = async (options) =>
  parseJsonContent(
    await requestCompletion(options)
  );

const transcribeAudio = async ({
  buffer,
  fileName,
  mimeType,
}) => {
  const provider = getProvider();

  if (!provider) {
    throw serviceError(
      "AI service is not configured. Set GROQ_API_KEY (free) or OPENAI_API_KEY on the server.",
      503
    );
  }

  const form = new FormData();

  form.append(
    "model",
    provider.transcriptionModel
  );

  form.append(
    "file",
    new Blob(
      [buffer],
      {
        type:
          mimeType || "audio/webm",
      }
    ),
    fileName || "answer.webm"
  );

  let response;

  try {
    response = await fetch(
      `${provider.baseUrl}/audio/transcriptions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${String(
            provider.key
          ).trim()}`,
        },
        body: form,
      }
    );
  } catch {
    throw serviceError(
      "Speech-to-text service is unavailable right now. Please try again.",
      502
    );
  }

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    console.error(
      `${provider.name.toUpperCase()} TRANSCRIBE ERROR:`,
      response.status,
      data
    );

    throw serviceError(
      "Speech-to-text service is unavailable right now. Please try again.",
      502
    );
  }

  const text =
    data && typeof data.text === "string"
      ? data.text.trim()
      : "";

  return text;
};

module.exports = {
  getProvider,
  requestCompletion,
  requestJson,
  transcribeAudio,
};
