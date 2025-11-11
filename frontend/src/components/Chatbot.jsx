import React, { useState, useRef, useEffect } from "react";
import { marked } from "marked";
import {
  Bot,
  User,
  Shield,
  AlertTriangle,
  CheckCircle,
  Send,
  Search,
  Loader,
  Sparkles,
  UserCheck,
  Minimize2,
  Eye,
  FileText,
  Scale,
  Baby,
  ChevronRight,
  XCircle,
  Check,
  ChevronDown,
} from "lucide-react";

// Helper component to render markdown content safely
const MarkdownRenderer = ({ content, className }) => {
  if (!content) return null;
  const html = marked(content, { gfm: true, breaks: true });
  return (
    <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
  );
};

// Icon mapping for agents
const agentIconMap = {
  "shield-check": Shield,
  "user-check": UserCheck,
  minimize: Minimize2,
  eye: Eye,
  "file-text": FileText,
  "alert-triangle": AlertTriangle,
  scale: Scale,
  baby: Baby,
};

// Agent Dropdown Selector (like Claude's model selector)
const AgentDropdown = ({
  agents,
  selectedAgents,
  onToggleAgent,
  onRunAgents,
  isAnalyzing,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedCount = selectedAgents.length;
  const hasSelection = selectedCount > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-11 h-11 flex items-center justify-center bg-white border-2 border-neutral-300 rounded-xl hover:bg-neutral-50 hover:border-blue-500 transition-all group shadow-sm"
        title={
          hasSelection
            ? `${selectedCount} agent${selectedCount > 1 ? "s" : ""} selected`
            : "Select agents"
        }
      >
        <Sparkles
          className={`w-5 h-5 transition-colors ${
            hasSelection
              ? "text-blue-600"
              : "text-neutral-500 group-hover:text-blue-600"
          }`}
        />
        {hasSelection && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
            {selectedCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 w-80 bg-white border border-neutral-200 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-neutral-200 sticky top-0 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-neutral-900">
                Select Agents
              </span>
              <button
                onClick={() => {
                  if (hasSelection) {
                    onRunAgents();
                    setIsOpen(false);
                  }
                }}
                disabled={!hasSelection || isAnalyzing}
                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
              >
                {isAnalyzing
                  ? "Running..."
                  : `Run${hasSelection ? ` (${selectedCount})` : ""}`}
              </button>
            </div>
          </div>
          <div className="p-2 space-y-1">
            {Object.entries(agents).map(([key, agent]) => {
              const IconComponent = agentIconMap[agent.icon] || Shield;
              const isSelected = selectedAgents.includes(key);

              return (
                <button
                  key={key}
                  onClick={() => onToggleAgent(key)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    isSelected
                      ? "bg-blue-50 border border-blue-200"
                      : "hover:bg-neutral-50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? "bg-blue-600 text-white"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-neutral-900 leading-tight">
                        {agent.name}
                      </h4>
                      <p className="text-xs text-neutral-600 line-clamp-1 mt-0.5">
                        {agent.description}
                      </p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? "border-blue-600 bg-blue-600"
                          : "border-neutral-300"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Agent Results Display Component - Structured like AnalysisSummary
const AgentResultsDisplay = ({ results }) => {
  // Helper to format key names
  const formatKeyName = (key) => {
    return key
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Helper to get icon for agent
  const getAgentIcon = (agentName) => {
    const name = agentName.toLowerCase();
    if (name.includes("gdpr") || name.includes("compliance"))
      return <Shield className="w-5 h-5" />;
    if (name.includes("kids") || name.includes("children"))
      return <Baby className="w-5 h-5" />;
    if (name.includes("rights")) return <UserCheck className="w-5 h-5" />;
    if (name.includes("minimization")) return <Minimize2 className="w-5 h-5" />;
    if (name.includes("tracker") || name.includes("third"))
      return <Eye className="w-5 h-5" />;
    if (name.includes("simplifier") || name.includes("plain"))
      return <FileText className="w-5 h-5" />;
    if (name.includes("breach") || name.includes("risk"))
      return <AlertTriangle className="w-5 h-5" />;
    if (name.includes("functionality") || name.includes("balance"))
      return <Scale className="w-5 h-5" />;
    return <Sparkles className="w-5 h-5" />;
  };

  const renderStructuredValue = (key, value) => {
    // Capitalize first letter of string
    const capitalizeFirst = (str) => {
      if (typeof str !== "string" || str.length === 0) return str;
      return str.charAt(0).toUpperCase() + str.slice(1);
    };

    // Handle arrays
    if (Array.isArray(value)) {
      if (value.length === 0) return null;
      return (
        <div className="mt-4">
          <h4 className="text-sm font-bold text-neutral-700 mb-3">
            {formatKeyName(key)}
          </h4>
          <ul className="space-y-2.5">
            {value.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-3 text-sm text-neutral-700 leading-relaxed bg-neutral-50 rounded-lg p-3 border border-neutral-200"
              >
                <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                <span>{capitalizeFirst(item)}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }

    // Handle booleans
    if (typeof value === "boolean") {
      return (
        <div className="mt-4">
          <h4 className="text-sm font-bold text-neutral-700 mb-3">
            {formatKeyName(key)}
          </h4>
          <div className="flex items-center gap-2 bg-neutral-50 rounded-lg p-4 border border-neutral-200">
            {value ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-semibold text-green-700">
                  Yes
                </span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm font-semibold text-red-700">No</span>
              </>
            )}
          </div>
        </div>
      );
    }

    // Handle numeric scores
    if (
      typeof value === "number" &&
      (key.includes("score") || key.includes("level"))
    ) {
      const getScoreColor = (score) => {
        if (score > 6) return "text-red-600";
        if (score > 3) return "text-yellow-600";
        return "text-green-600";
      };
      const getScoreBgColor = (score) => {
        if (score > 6) return "bg-red-50 border-red-200";
        if (score > 3) return "bg-yellow-50 border-yellow-200";
        return "bg-green-50 border-green-200";
      };
      const getScoreIcon = (score) => {
        if (score > 6) return <AlertTriangle className="w-5 h-5" />;
        if (score > 3) return <Shield className="w-5 h-5" />;
        return <CheckCircle className="w-5 h-5" />;
      };

      return (
        <div className="mt-4">
          <h4 className="text-sm font-bold text-neutral-700 mb-3">
            {formatKeyName(key)}
          </h4>
          <div
            className={`inline-flex items-center gap-3 px-5 py-3 rounded-xl border-2 ${getScoreBgColor(
              value
            )}`}
          >
            <div className={getScoreColor(value)}>{getScoreIcon(value)}</div>
            <span className={`font-bold text-xl ${getScoreColor(value)}`}>
              {value}/10
            </span>
          </div>
        </div>
      );
    }

    // Handle string risk levels (Low, Medium, High, Critical)
    if (
      typeof value === "string" &&
      key.toLowerCase().includes("risk") &&
      key.toLowerCase().includes("level")
    ) {
      const normalizedValue = value.toLowerCase();
      const getRiskColor = () => {
        if (
          normalizedValue.includes("critical") ||
          normalizedValue.includes("high")
        )
          return "text-red-600";
        if (normalizedValue.includes("medium")) return "text-yellow-600";
        return "text-green-600";
      };
      const getRiskBgColor = () => {
        if (
          normalizedValue.includes("critical") ||
          normalizedValue.includes("high")
        )
          return "bg-red-50 border-red-200";
        if (normalizedValue.includes("medium"))
          return "bg-yellow-50 border-yellow-200";
        return "bg-green-50 border-green-200";
      };
      const getRiskIcon = () => {
        if (
          normalizedValue.includes("critical") ||
          normalizedValue.includes("high")
        )
          return <AlertTriangle className="w-5 h-5" />;
        if (normalizedValue.includes("medium"))
          return <Shield className="w-5 h-5" />;
        return <CheckCircle className="w-5 h-5" />;
      };

      return (
        <div className="mt-4">
          <h4 className="text-sm font-bold text-neutral-700 mb-3">
            {formatKeyName(key)}
          </h4>
          <div
            className={`inline-flex items-center gap-3 px-5 py-3 rounded-xl border-2 ${getRiskBgColor()}`}
          >
            <div className={getRiskColor()}>{getRiskIcon()}</div>
            <span className={`font-bold text-lg ${getRiskColor()}`}>
              {value}
            </span>
          </div>
        </div>
      );
    }

    // Handle regular strings
    if (typeof value === "string") {
      return (
        <div className="mt-4">
          <h4 className="text-sm font-bold text-neutral-700 mb-3">
            {formatKeyName(key)}
          </h4>
          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
            <MarkdownRenderer
              content={value}
              className="prose prose-sm prose-neutral max-w-none text-neutral-700 leading-relaxed"
            />
          </div>
        </div>
      );
    }

    return null;
  };

  const renderResult = (result) => {
    // If result is a string, render it directly
    if (typeof result === "string") {
      return (
        <div className="bg-blue-50 rounded-xl p-5 border-2 border-blue-200">
          <MarkdownRenderer
            content={result}
            className="prose prose-sm prose-neutral max-w-none text-neutral-700 leading-relaxed"
          />
        </div>
      );
    }

    // If result is an object, sort entries to show scores and booleans first
    if (typeof result === "object" && result !== null) {
      const entries = Object.entries(result);

      // Separate entries into priority groups
      const priorityEntries = entries.filter(([key, value]) => {
        const lowerKey = key.toLowerCase();
        return (
          typeof value === "boolean" ||
          (typeof value === "number" &&
            (lowerKey.includes("score") || lowerKey.includes("level"))) ||
          lowerKey.includes("compliant") ||
          lowerKey.includes("status") ||
          lowerKey === "risk_level" ||
          lowerKey === "tracking_risk_level"
        );
      });

      const otherEntries = entries.filter(([key, value]) => {
        const lowerKey = key.toLowerCase();
        return !(
          typeof value === "boolean" ||
          (typeof value === "number" &&
            (lowerKey.includes("score") || lowerKey.includes("level"))) ||
          lowerKey.includes("compliant") ||
          lowerKey.includes("status") ||
          lowerKey === "risk_level" ||
          lowerKey === "tracking_risk_level"
        );
      });

      // Render priority items first, then others
      const sortedEntries = [...priorityEntries, ...otherEntries];

      return (
        <div className="space-y-4">
          {sortedEntries.map(([key, value]) => (
            <div key={key}>{renderStructuredValue(key, value)}</div>
          ))}
        </div>
      );
    }

    return <p className="text-sm text-neutral-700">{String(result)}</p>;
  };

  return (
    <div className="space-y-6">
      {results.map((agentResult, index) => {
        const agentIcon = getAgentIcon(agentResult.agentName);

        return (
          <div
            key={index}
            className="bg-gradient-to-br from-white to-neutral-50 rounded-2xl border-2 border-neutral-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white">
                  {agentIcon}
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {agentResult.agentName}
                </h3>
              </div>
            </div>
            <div className="p-6">{renderResult(agentResult.result)}</div>
          </div>
        );
      })}
    </div>
  );
};

// The original ChatHeader component, aligned to the left
const ChatHeader = () => (
  <header className="border-b border-neutral-200 bg-white sticky top-0 z-10">
    <div className="px-6 py-4">
      <div className="flex items-center justify-start">
        <button
          onClick={() => (window.location.href = "/")}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer group"
        >
          <div className="w-10 h-10 bg-neutral-900 rounded-lg flex items-center justify-center group-hover:bg-neutral-800 transition-colors">
            <Search className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            Privacy<span className="text-blue-600">Lens</span>
          </h1>
        </button>
      </div>
    </div>
  </header>
);

// --- AnalysisSummary ---
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
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-neutral-200 pb-4 mb-4">
          <div className="text-center md:text-left">
            {/* <p className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
              Company
            </p> */}
            <h2 className="text-2xl font-bold text-neutral-800 tracking-tight mt-1">
              {summary.company_name || "Unknown"}
            </h2>
          </div>
          <div className="flex-shrink-0 text-center md:text-right">
            {/* <p className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              Risk Assessment
            </p> */}
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getRiskBgColor(
                summary.risk_score
              )}`}
            >
              <div className={getRiskColor(summary.risk_score)}>
                {getRiskIcon(summary.risk_score)}
              </div>
              <span
                className={`font-semibold text-base ${getRiskColor(
                  summary.risk_score
                )}`}
              >
                {getRiskLabel(summary.risk_score)}
              </span>
              <div className="w-px h-4 bg-neutral-300 mx-1"></div>
              <span
                className={`font-bold text-base ${getRiskColor(
                  summary.risk_score
                )}`}
              >
                {summary.risk_score}/10
              </span>
            </div>
          </div>
        </div>
        {/* Bottom area for summary */}
        <div>
          <p className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
            Summary
          </p>
          <p className="text-sm text-neutral-700 leading-relaxed mt-2">
            {summary.final_summary}
          </p>
        </div>
      </div>
    </div>
  );
};

// Components for User messages, Bot messages and Loading indicator
const UserMessage = ({ message }) => {
  // Check if this is an agent request marker
  const isAgentRequest = message.text.startsWith("[Agent:");

  if (isAgentRequest) {
    // Extract agent name from [Agent: Agent Name] format
    const agentName = message.text.match(/\[Agent: (.+)\]/)?.[1] || "Agent";
    return (
      <div className="px-6 py-4 animate-fadeIn">
        <div className="max-w-5xl mx-auto flex justify-end">
          <div className="flex items-end gap-3 max-w-3xl">
            <div className="bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-md">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span className="font-medium">Run {agentName}</span>
              </div>
            </div>
            <div className="w-8 h-8 bg-neutral-900 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-4 animate-fadeIn">
      <div className="max-w-5xl mx-auto flex justify-end">
        <div className="flex items-end gap-3 max-w-3xl">
          <div className="bg-neutral-900 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-md">
            <MarkdownRenderer
              content={message.text}
              className="prose prose-invert max-w-none text-base"
            />
          </div>
          <div className="w-8 h-8 bg-neutral-900 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

const BotMessage = ({ message }) => {
  // Helper function to get risk styling (same as summary section)
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

  // Helper for string risk levels
  const getStringRiskColor = (level) => {
    const normalizedLevel = level.toLowerCase();
    if (
      normalizedLevel.includes("critical") ||
      normalizedLevel.includes("high")
    )
      return "text-red-500";
    if (normalizedLevel.includes("medium")) return "text-yellow-500";
    return "text-green-500";
  };
  const getStringRiskBgColor = (level) => {
    const normalizedLevel = level.toLowerCase();
    if (
      normalizedLevel.includes("critical") ||
      normalizedLevel.includes("high")
    )
      return "bg-red-50 border-red-200";
    if (normalizedLevel.includes("medium"))
      return "bg-yellow-50 border-yellow-200";
    return "bg-green-50 border-green-200";
  };
  const getStringRiskIcon = (level) => {
    const normalizedLevel = level.toLowerCase();
    if (
      normalizedLevel.includes("critical") ||
      normalizedLevel.includes("high")
    )
      return <AlertTriangle className="w-4 h-4" />;
    if (normalizedLevel.includes("medium"))
      return <Shield className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  // Helper function to format agent responses into readable text
  const formatAgentResponse = (data) => {
    let formatted = "";
    let priorityMetrics = {}; // Store priority metrics to display at top

    // Helper to format key names
    const formatKey = (key) => {
      return key
        .replace(/_/g, " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    };

    // First pass: extract priority metrics
    Object.entries(data).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();

      // Check for priority fields
      if (
        lowerKey.includes("compliant") ||
        lowerKey.includes("score") ||
        lowerKey === "risk_level" ||
        lowerKey === "tracking_risk_level" ||
        lowerKey.includes("status")
      ) {
        priorityMetrics[key] = value;
      }
    });

    // Second pass: format remaining fields
    Object.entries(data).forEach(([key, value]) => {
      const formattedKey = formatKey(key);
      const lowerKey = key.toLowerCase();

      // Skip priority metrics (already handled)
      if (priorityMetrics.hasOwnProperty(key)) {
        return;
      }

      if (Array.isArray(value)) {
        if (value.length > 0) {
          formatted += `**${formattedKey}:**\n`;
          value.forEach((item) => {
            formatted += `• ${item}\n`;
          });
          formatted += "\n";
        }
      } else if (typeof value === "boolean") {
        formatted += `**${formattedKey}:** ${value ? "Yes ✓" : "No ✗"}\n\n`;
      } else if (typeof value === "number") {
        formatted += `**${formattedKey}:** ${value}\n\n`;
      } else if (typeof value === "string") {
        formatted += `**${formattedKey}:**\n${value}\n\n`;
      }
    });

    return { formatted: formatted.trim(), priorityMetrics };
  };

  // Try to parse as JSON to detect agent responses
  let parsedResult = null;
  let isAgentResponse = false;
  let formattedContent = message.text;
  let priorityMetrics = null;

  try {
    parsedResult = JSON.parse(message.text);
    isAgentResponse = true;
    // Format the JSON response into readable markdown
    const result = formatAgentResponse(parsedResult);
    formattedContent = result.formatted;
    priorityMetrics = result.priorityMetrics;
  } catch (e) {
    // Not JSON, treat as regular message
  }

  // All messages (including agent responses) display the same way
  return (
    <div className="bg-neutral-50 px-6 py-6 animate-fadeIn">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start gap-4">
          <div className="w-8 h-8 bg-white border border-neutral-200 rounded-full flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 text-neutral-700" />
          </div>
          <div className="flex-1 min-w-0">
            {/* Priority Metrics Display */}
            {priorityMetrics && Object.keys(priorityMetrics).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(priorityMetrics).map(([key, value]) => {
                  const lowerKey = key.toLowerCase();

                  // Handle numeric scores
                  if (
                    typeof value === "number" &&
                    (lowerKey.includes("score") || lowerKey.includes("level"))
                  ) {
                    return (
                      <div
                        key={key}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getRiskBgColor(
                          value
                        )}`}
                      >
                        <div className={getRiskColor(value)}>
                          {getRiskIcon(value)}
                        </div>
                        <span
                          className={`font-semibold text-sm ${getRiskColor(
                            value
                          )}`}
                        >
                          {getRiskLabel(value)}
                        </span>
                        <div className="w-px h-4 bg-neutral-300 mx-1"></div>
                        <span
                          className={`font-bold text-sm ${getRiskColor(value)}`}
                        >
                          {value}/10
                        </span>
                      </div>
                    );
                  }

                  // Handle string risk levels
                  if (
                    typeof value === "string" &&
                    lowerKey.includes("risk") &&
                    lowerKey.includes("level")
                  ) {
                    return (
                      <div
                        key={key}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getStringRiskBgColor(
                          value
                        )}`}
                      >
                        <div className={getStringRiskColor(value)}>
                          {getStringRiskIcon(value)}
                        </div>
                        <span
                          className={`font-semibold text-sm ${getStringRiskColor(
                            value
                          )}`}
                        >
                          {value}
                        </span>
                      </div>
                    );
                  }

                  // Handle boolean compliance
                  if (
                    typeof value === "boolean" &&
                    (lowerKey.includes("compliant") ||
                      lowerKey.includes("status"))
                  ) {
                    return (
                      <div
                        key={key}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${
                          value
                            ? "bg-green-50 border-green-200"
                            : "bg-red-50 border-red-200"
                        }`}
                      >
                        {value ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="font-semibold text-sm text-green-500">
                              Compliant
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span className="font-semibold text-sm text-red-500">
                              Non-Compliant
                            </span>
                          </>
                        )}
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            )}

            {/* Main Content */}
            <MarkdownRenderer
              content={formattedContent}
              className="prose prose-neutral max-w-none text-neutral-700 leading-relaxed text-base"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
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
  if (!result || !result.analysis) {
    return (
      <div className="flex flex-col h-screen bg-neutral-50">
        <ChatHeader />
        <div className="flex-1 flex items-center justify-center">
          <Loader className="w-8 h-8 animate-spin text-neutral-500" />
          <p className="ml-4 text-neutral-600">Loading analysis...</p>
        </div>
      </div>
    );
  }

  const {
    policy_id,
    policy_text,
    analysis,
    history: initialMessages = [],
  } = result;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [agents, setAgents] = useState({});
  const [selectedAgents, setSelectedAgents] = useState(["policy_simplifier"]); // Default selection
  const [agentResults, setAgentResults] = useState([]);
  const [isAnalyzingAgents, setIsAnalyzingAgents] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch available agents
  useEffect(() => {
    fetch("/api/agents", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setAgents(data))
      .catch((err) => console.error("Failed to load agents:", err));
  }, []);

  useEffect(() => {
    const formattedMessages = initialMessages.map((msg) => ({
      ...msg,
      user: msg.is_user,
    }));
    if (formattedMessages.length === 0) {
      setMessages([
        {
          text: "Hello! I've analyzed this policy. Ask me anything to get started.",
          user: false,
        },
      ]);
    } else {
      setMessages(formattedMessages);
    }
  }, [initialMessages, policy_id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages, agentResults]);

  // Function to reload chat history
  const reloadChatHistory = async () => {
    try {
      const response = await fetch(`/api/chats/${policy_id}`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        const formattedMessages = (data.history || []).map((msg) => ({
          ...msg,
          user: msg.is_user,
        }));
        setMessages(formattedMessages);
      }
    } catch (err) {
      console.error("Failed to reload chat history:", err);
    }
  };

  const toggleAgent = (agentKey) => {
    setSelectedAgents((prev) =>
      prev.includes(agentKey)
        ? prev.filter((key) => key !== agentKey)
        : [...prev, agentKey]
    );
  };

  const runSelectedAgents = async () => {
    if (selectedAgents.length === 0 || !policy_text) return;

    setIsAnalyzingAgents(true);
    setAgentResults([]);

    const results = [];

    for (const agentKey of selectedAgents) {
      try {
        const response = await fetch(`/api/agents/${agentKey}/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            policy_id: policy_id,
            policy_text: policy_text,
            params: {},
          }),
        });

        const data = await response.json();

        if (response.ok) {
          results.push({
            agentKey,
            agentName: agents[agentKey]?.name || agentKey,
            result: data.result,
          });
        } else {
          results.push({
            agentKey,
            agentName: agents[agentKey]?.name || agentKey,
            result: `Error: ${data.error || "Analysis failed"}`,
          });
        }
      } catch (err) {
        results.push({
          agentKey,
          agentName: agents[agentKey]?.name || agentKey,
          result: `Error: ${err.message}`,
        });
      }
    }

    setAgentResults(results);
    setIsAnalyzingAgents(false);

    // Reload chat history to show persisted agent responses
    await reloadChatHistory();
  };

  const handleSend = async () => {
    if (input.trim() && !isLoading) {
      const userMessage = { text: input, user: true };
      setMessages((prev) => [...prev, userMessage]);
      const currentInput = input;
      setInput("");
      setIsLoading(true);
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: currentInput,
            policy_id: policy_id,
          }),
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
          <AnalysisSummary summary={analysis} />

          {/* Agent Results Display */}
          {agentResults.length > 0 && (
            <div className="mt-6">
              <AgentResultsDisplay results={agentResults} />
            </div>
          )}
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
      <div className="border-t border-neutral-200 bg-gradient-to-b from-white to-neutral-50/50 backdrop-blur-sm shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <div className="flex items-center gap-3">
            {/* Agent Dropdown Selector */}
            {Object.keys(agents).length > 0 && (
              <AgentDropdown
                agents={agents}
                selectedAgents={selectedAgents}
                onToggleAgent={toggleAgent}
                onRunAgents={runSelectedAgents}
                isAnalyzing={isAnalyzingAgents}
              />
            )}

            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about the policy..."
                className="w-full px-5 py-3 border-2 border-neutral-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none text-sm bg-white transition-all duration-200 placeholder-neutral-400 shadow-sm"
                disabled={isLoading}
                rows={1}
                style={{ minHeight: "44px", maxHeight: "120px" }}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height =
                    Math.min(e.target.scrollHeight, 120) + "px";
                }}
              />
            </div>

            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className={`${sendButtonClasses} text-white rounded-xl disabled:cursor-not-allowed flex items-center justify-center w-11 h-11 transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none`}
            >
              <Send className="w-5 h-5" />
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
