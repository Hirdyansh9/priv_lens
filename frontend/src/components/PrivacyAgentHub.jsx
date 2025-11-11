import React, { useState, useEffect } from "react";
import {
  Shield,
  UserCheck,
  Minimize2,
  Eye,
  FileText,
  AlertTriangle,
  Scale,
  Baby,
  ArrowRight,
  Loader2,
  ChevronRight,
  CheckCircle,
  XCircle,
} from "lucide-react";

const iconMap = {
  "shield-check": Shield,
  "user-check": UserCheck,
  minimize: Minimize2,
  eye: Eye,
  "file-text": FileText,
  "alert-triangle": AlertTriangle,
  scale: Scale,
  baby: Baby,
};

const AgentCard = ({ agentKey, agent, onSelect, isActive }) => {
  const IconComponent = iconMap[agent.icon] || Shield;

  return (
    <button
      onClick={() => onSelect(agentKey)}
      className={`w-full text-left p-6 rounded-xl border-2 transition-all ${
        isActive
          ? "border-blue-600 bg-blue-50 shadow-lg"
          : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-md"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isActive
              ? "bg-blue-600 text-white"
              : "bg-neutral-100 text-neutral-600"
          }`}
        >
          <IconComponent className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-neutral-900 mb-1">{agent.name}</h3>
          <p className="text-sm text-neutral-600">{agent.description}</p>
        </div>
        <ChevronRight
          className={`w-5 h-5 flex-shrink-0 ${
            isActive ? "text-blue-600" : "text-neutral-400"
          }`}
        />
      </div>
    </button>
  );
};

const ResultDisplay = ({ result, agentType }) => {
  const renderResult = () => {
    if (typeof result === "string") {
      return (
        <div className="prose prose-neutral max-w-none">
          <div
            dangerouslySetInnerHTML={{ __html: result.replace(/\n/g, "<br/>") }}
          />
        </div>
      );
    }

    if (typeof result === "object") {
      return (
        <div className="space-y-4">
          {Object.entries(result).map(([key, value]) => (
            <div key={key} className="bg-neutral-50 p-4 rounded-lg">
              <h4 className="font-semibold text-neutral-900 mb-2 capitalize">
                {key.replace(/_/g, " ")}
              </h4>
              {Array.isArray(value) ? (
                <ul className="space-y-1">
                  {value.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm text-neutral-700"
                    >
                      <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : typeof value === "boolean" ? (
                <div className="flex items-center gap-2">
                  {value ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className="text-sm text-neutral-700">
                    {value ? "Yes" : "No"}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-neutral-700">{String(value)}</p>
              )}
            </div>
          ))}
        </div>
      );
    }

    return <p className="text-neutral-700">{String(result)}</p>;
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6">
      <h3 className="text-lg font-bold text-neutral-900 mb-4">
        Analysis Results
      </h3>
      {renderResult()}
    </div>
  );
};

const PrivacyAgentHub = ({ policyId, policyText }) => {
  const [agents, setAgents] = useState({});
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [additionalParams, setAdditionalParams] = useState({});
  const [customPolicyText, setCustomPolicyText] = useState("");
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(policyId || "");

  useEffect(() => {
    // Fetch available agents
    fetch("/api/agents", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setAgents(data))
      .catch((err) => console.error("Failed to load agents:", err));

    // Fetch user's chats for selection
    fetch("/api/chats", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setChats(data))
      .catch((err) => console.error("Failed to load chats:", err));
  }, []);

  const runAgent = async () => {
    if (!selectedAgent) return;

    // Determine which policy text to use
    let policyToAnalyze = customPolicyText || policyText;
    let policyIdToUse = selectedChatId || policyId;

    // If a chat is selected, fetch its text
    if (policyIdToUse && !policyToAnalyze) {
      try {
        const response = await fetch(`/api/chats/${policyIdToUse}`, {
          credentials: "include",
        });
        const chatData = await response.json();
        policyToAnalyze = chatData.policy_text;
      } catch (err) {
        setError("Failed to load policy from selected chat");
        return;
      }
    }

    if (!policyToAnalyze) {
      setError("Please provide policy text or select a chat");
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(`/api/agents/${selectedAgent}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          policy_id: policyIdToUse,
          policy_text: policyToAnalyze,
          params: additionalParams,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setResult(data.result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderAdditionalInputs = () => {
    if (selectedAgent === "privacy_rights") {
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Your Jurisdiction
            </label>
            <input
              type="text"
              placeholder="e.g., EU, California, General"
              className="w-full p-2 border border-neutral-200 rounded-lg"
              value={additionalParams.jurisdiction || ""}
              onChange={(e) =>
                setAdditionalParams({
                  ...additionalParams,
                  jurisdiction: e.target.value,
                })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Specific Question (Optional)
            </label>
            <textarea
              placeholder="What would you like to know about your rights?"
              className="w-full p-2 border border-neutral-200 rounded-lg"
              rows={2}
              value={additionalParams.question || ""}
              onChange={(e) =>
                setAdditionalParams({
                  ...additionalParams,
                  question: e.target.value,
                })
              }
            />
          </div>
        </div>
      );
    }

    if (selectedAgent === "policy_simplifier") {
      return (
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Specific Section to Simplify (Optional)
          </label>
          <textarea
            placeholder="Paste a specific section or leave empty for overall summary"
            className="w-full p-2 border border-neutral-200 rounded-lg"
            rows={3}
            value={additionalParams.question || ""}
            onChange={(e) =>
              setAdditionalParams({
                ...additionalParams,
                question: e.target.value,
              })
            }
          />
        </div>
      );
    }

    if (selectedAgent === "privacy_functionality") {
      return (
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Your Concern
          </label>
          <textarea
            placeholder="What features are you considering disabling for privacy?"
            className="w-full p-2 border border-neutral-200 rounded-lg"
            rows={2}
            value={additionalParams.concern || ""}
            onChange={(e) =>
              setAdditionalParams({
                ...additionalParams,
                concern: e.target.value,
              })
            }
          />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">
          Privacy Agent Hub
        </h1>
        <p className="text-neutral-600">
          Specialized AI agents for comprehensive privacy analysis
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Agent Selection */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="font-semibold text-neutral-900 mb-3">
            Select an Agent
          </h2>
          {Object.entries(agents).map(([key, agent]) => (
            <AgentCard
              key={key}
              agentKey={key}
              agent={agent}
              onSelect={setSelectedAgent}
              isActive={selectedAgent === key}
            />
          ))}
        </div>

        {/* Right: Analysis Panel */}
        <div className="lg:col-span-2">
          {selectedAgent ? (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-neutral-200 p-6">
                <h2 className="text-xl font-bold text-neutral-900 mb-4">
                  {agents[selectedAgent]?.name}
                </h2>

                {/* Policy Input Section */}
                <div className="mb-4 space-y-3">
                  <label className="block text-sm font-medium text-neutral-700">
                    Policy Source
                  </label>

                  {/* Option 1: Select from existing chats */}
                  {chats.length > 0 && (
                    <div>
                      <select
                        className="w-full p-2 border border-neutral-200 rounded-lg"
                        value={selectedChatId}
                        onChange={(e) => {
                          setSelectedChatId(e.target.value);
                          setCustomPolicyText(""); // Clear custom text when selecting a chat
                        }}
                      >
                        <option value="">
                          -- Select from your analyzed policies --
                        </option>
                        {chats.map((chat) => (
                          <option key={chat.policy_id} value={chat.policy_id}>
                            {chat.policy_name || `Policy ${chat.policy_id}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Option 2: Paste custom policy text */}
                  <div className="relative">
                    <textarea
                      placeholder="Or paste policy text here to analyze..."
                      className="w-full p-3 border border-neutral-200 rounded-lg text-sm"
                      rows={4}
                      value={customPolicyText}
                      onChange={(e) => {
                        setCustomPolicyText(e.target.value);
                        if (e.target.value) setSelectedChatId(""); // Clear chat selection when typing
                      }}
                    />
                  </div>
                </div>

                {renderAdditionalInputs()}

                <button
                  onClick={runAgent}
                  disabled={
                    isLoading ||
                    (!customPolicyText && !selectedChatId && !policyText)
                  }
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg disabled:bg-neutral-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Run Analysis
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                {error && (
                  <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                    {error}
                  </div>
                )}
              </div>

              {result && (
                <ResultDisplay result={result} agentType={selectedAgent} />
              )}
            </div>
          ) : (
            <div className="bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-300 p-12 text-center">
              <Shield className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-600 mb-2">
                Select an Agent to Begin
              </h3>
              <p className="text-neutral-500">
                Choose a privacy agent from the left to analyze your policy
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrivacyAgentHub;
