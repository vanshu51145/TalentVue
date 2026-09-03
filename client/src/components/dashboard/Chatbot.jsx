import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hi! 👋 I'm your AI Assistant. How can I help you today?",
    },
  ]);

  const sendMessage = () => {
    if (!message.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: message,
      },
      {
        sender: "bot",
        text: "Thanks for your question! I'm here to help you clear your doubts.",
      },
    ]);

    setMessage("");
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[450px] w-[350px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">

          {/* Header */}
          <div className="flex items-center justify-between bg-slate-900 px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500">
                🤖
              </div>

              <div>
                <h3 className="font-semibold">AI Assistant</h3>
                <p className="text-xs text-slate-300">
                  Ask your doubts
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-2 hover:bg-slate-700"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
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
                      ? "rounded-br-sm bg-indigo-600 text-white"
                      : "rounded-bl-sm bg-white text-slate-700 shadow-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 border-t bg-white p-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              placeholder="Type your doubt..."
              className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm outline-none focus:border-indigo-500"
            />

            <button
              onClick={sendMessage}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Chatbot Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-all duration-300 hover:scale-110 hover:bg-indigo-700"
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