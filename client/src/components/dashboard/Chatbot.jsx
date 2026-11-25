import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";

import { apiFetch } from "../../utils/api";

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hi! 👋 I'm your AI Assistant. How can I help you today?",
    },
  ]);

  const sendMessage = async () => {
    const text = message.trim();

    if (!text || isLoading) return;

    const nextMessages = [
      ...messages,
      {
        sender: "user",
        text,
      },
    ];

    setMessages(nextMessages);
    setMessage("");
    setIsLoading(true);

    const result = await apiFetch("/api/ai/chat", {
      method: "POST",
      body: {
        messages: nextMessages.map((msg) => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.text,
        })),
      },
    }).catch(() => ({
      ok: false,
      data: {
        message:
          "Unable to reach the AI service. Please try again.",
      },
    }));

    setMessages((prev) => [
      ...prev,
      {
        sender: "bot",
        text: result.ok
          ? result.data?.message ||
            "AI service returned an empty response."
          : result.data?.message ||
            "AI service is unavailable right now.",
      },
    ]);

    setIsLoading(false);
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className="glass-card fixed bottom-24 right-5 z-50 flex h-[450px] w-[350px] flex-col overflow-hidden rounded-2xl">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 text-slate-900">
            <div className="flex items-center gap-3">
              <div className="glass-button flex h-10 w-10 items-center justify-center rounded-full">
                🤖
              </div>

              <div>
                <h3 className="font-semibold">AI Assistant</h3>
                <p className="text-xs text-slate-500">
                  Ask your doubts
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-2 text-slate-500 hover:bg-white/70 hover:text-indigo-600"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${
                  msg.sender === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    msg.sender === "user"
                      ? "glass-button rounded-br-sm text-white"
                      : "glass-card rounded-bl-sm text-slate-700"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="glass-card rounded-2xl rounded-bl-sm px-4 py-2 text-sm text-slate-500">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="glass-nav flex items-center gap-2 border-t p-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              disabled={isLoading}
              placeholder="Type your doubt..."
              className="glass-card flex-1 rounded-full px-4 py-2 text-sm outline-none focus:border-indigo-400 disabled:opacity-60"
            />

            <button
              onClick={sendMessage}
              disabled={isLoading || !message.trim()}
              className="glass-button flex h-10 w-10 items-center justify-center rounded-full text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Chatbot Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass-button fixed bottom-5 right-5 z-50 flex h-16 w-16 items-center justify-center rounded-full text-white transition-all duration-300 hover:scale-110"
      >
        {isOpen ? (
          <X size={28} />
        ) : (
          <MessageCircle size={30} />
        )}
      </button>
    </>
  );
}

export default Chatbot;
