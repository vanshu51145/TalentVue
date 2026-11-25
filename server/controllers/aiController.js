const { requestCompletion } = require("../services/aiService");

const SYSTEM_PROMPT =
  "You are the TalentVue AI assistant. Help users with mock interview preparation, resume feedback, project explanations, and interview doubts. Be concise, practical, and friendly. If you do not know something, say so.";

const normalizeMessages = (raw) => {
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const messages = raw
    .filter(
      (msg) =>
        msg &&
        (msg.role === "user" || msg.role === "assistant")
    )
    .map((msg) => ({
      role: msg.role,
      content: String(msg.content || "")
        .trim()
        .slice(0, 2000),
    }))
    .filter((msg) => msg.content);

  if (!messages.length) return null;

  return messages.slice(-20);
};

const chat = async (req, res) => {
  const messages = normalizeMessages(
    req.body && req.body.messages
  );

  if (!messages) {
    return res.status(400).json({
      message: "A non-empty messages array is required.",
    });
  }

  try {
    const reply = await requestCompletion({
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        ...messages,
      ],
      maxTokens: 1000,
      temperature: 0.7,
    });

    res.status(200).json({
      message: reply,
    });
  } catch (error) {
    if (error.statusCode) {
      return res
        .status(error.statusCode)
        .json({ message: error.message });
    }

    console.error("AI CHAT ERROR:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = { chat };
