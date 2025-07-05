import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  Bot,
  User,
  Shield,
  AlertTriangle,
  CheckCircle,
  ArrowUp,
  Search,
} from "lucide-react";

// The clean header component for the chatbot page
const ChatHeader = () => (
  <header className="border-b border-neutral-200 bg-white sticky top-0 z-10">
    <div className="max-w-5xl mx-auto px-6 py-4">
      <div className="flex items-center justify-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-neutral-900 rounded-lg flex items-center justify-center">
            <Search className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            Privacy<span className="text-blue-600">Lens</span>
          </h1>
        </div>
      </div>
    </div>
  </header>
);

// The analysis summary card
const AnalysisSummary = ({ summary }) => {
  const getRiskColor = (score) => {
    if (score > 6) return "text-red-500";
    if (score > 3) return "text-yellow-500";
    return "text-green-500";
  };
  const getRiskBgColor = (score) => {
    if (score > 6) return "bg-red-50 border-red-200";
    if (score > 3) return "bg-yellow-50 border-yellow-200";
    return "bg-green-50 border-green-200";
  };
  const getRiskIcon = (score) => {
    if (score > 6) return <AlertTriangle className="w-4 h-4" />;
    if (score > 3) return <Shield className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };
  const getRiskLabel = (score) => {
    if (score > 6) return "High Risk";
    if (score > 3) return "Medium Risk";
    return "Low Risk";
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
      <div className="px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Company
              </div>
              <div className="text-xl font-bold text-neutral-900">
                {summary.company_name}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                Risk Assessment
              </div>
              <div
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border ${getRiskBgColor(
                  summary.risk_score
                )}`}
              >
                <div className={getRiskColor(summary.risk_score)}>
                  {getRiskIcon(summary.risk_score)}
                </div>
                <span
                  className={`font-semibold text-sm ${getRiskColor(
                    summary.risk_score
                  )}`}
                >
                  {getRiskLabel(summary.risk_score)}
                </span>
                <div className="w-px h-4 bg-neutral-300 mx-1"></div>
                <span
                  className={`font-bold text-sm ${getRiskColor(
                    summary.risk_score
                  )}`}
                >
                  {summary.risk_score}/10
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Summary
            </div>
            <p className="text-sm text-neutral-700 leading-relaxed">
              {summary.final_summary}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Components for User messages, Bot messages, and Loading indicator
const UserMessage = ({ message }) => (
  <div className="px-6 py-4 animate-fadeIn">
    <div className="max-w-5xl mx-auto flex justify-end">
      <div className="flex items-end gap-3 max-w-3xl">
        <div className="bg-neutral-900 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-md">
          <ReactMarkdown className="prose prose-sm prose-invert max-w-none">
            {message.text}
          </ReactMarkdown>
        </div>
        <div className="w-8 h-8 bg-neutral-900 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-white" />
        </div>
      </div>
    </div>
  </div>
);
const BotMessage = ({ message }) => (
  <div className="bg-neutral-50 px-6 py-6 animate-fadeIn">
    <div className="max-w-5xl mx-auto">
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 bg-white border border-neutral-200 rounded-full flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-neutral-700" />
        </div>
        <div className="flex-1 min-w-0">
          <ReactMarkdown className="prose prose-neutral max-w-none text-left">
            {message.text}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  </div>
);
const LoadingMessage = () => (
  <div className="px-6 py-6 animate-fadeIn">
    <div className="max-w-5xl mx-auto">
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 bg-white border border-neutral-200 rounded-full flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-neutral-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
            </div>
            <span className="text-sm text-neutral-600">Analyzing...</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Chatbot = ({ result }) => {
  const { policy_id, analysis_summary, messages: initialMessages } = result;

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Effect to update messages when a new chat is loaded from history
  useEffect(() => {
    setMessages(
      initialMessages || [
        {
          text: "Hello! I've analyzed this policy. Ask me anything to get started.",
          user: false,
        },
      ]
    );
  }, [initialMessages, policy_id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (input.trim() && !isLoading) {
      const userMessage = { text: input, user: true };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: input, policy_id: policy_id }),
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "An unknown error occurred.");
        const botMessage = {
          text: data.reply || "Sorry, I encountered an issue.",
          user: false,
        };
        setMessages((prev) => [...prev, botMessage]);
      } catch (error) {
        const errorMessage = {
          text: `**Error:** ${error.message}`,
          user: false,
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const sendButtonClasses =
    "bg-[linear-gradient(135deg,#171717_0%,#262626_50%,#171717_100%)] shadow-[0_2px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all ease-in-out duration-200 hover:not(:disabled):bg-[linear-gradient(135deg,#262626_0%,#404040_50%,#262626_100%)] hover:not(:disabled):shadow-[0_4px_12px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)] hover:not(:disabled):-translate-y-px disabled:bg-neutral-300 disabled:shadow-none";

  return (
    <div className="flex flex-col h-screen bg-neutral-50">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <AnalysisSummary summary={analysis_summary} />
        </div>

        <div className="pb-6">
          {messages.map((msg, index) =>
            msg.user ? (
              <UserMessage key={index} message={msg} />
            ) : (
              <BotMessage key={index} message={msg} />
            )
          )}
          {isLoading && <LoadingMessage />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-neutral-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about the policy..."
              className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:border-neutral-400 focus:shadow-[0_0_0_3px_rgba(0,0,0,0.05)] resize-none text-sm bg-white transition-all duration-200 placeholder-neutral-500"
              disabled={isLoading}
              rows={1}
              style={{ minHeight: "48px", maxHeight: "120px" }}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height =
                  Math.min(e.target.scrollHeight, 120) + "px";
              }}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className={`${sendButtonClasses} text-white rounded-xl disabled:cursor-not-allowed flex items-center justify-center min-w-[48px] min-h-[48px] p-3`}
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-neutral-500 text-center mt-3">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
