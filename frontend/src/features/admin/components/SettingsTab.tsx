"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Bot,
  Sliders,
  Cpu,
  Key,
  Globe,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Zap,
  Save,
  Database,
  Layers,
  HelpCircle,
  Check,
  Server,
} from "lucide-react";
import { Card, Button, Input, Alert, Badge } from "@/components/ui";
import { adminApi } from "@/lib/api";
import { SystemSettings, TestConnectionResult } from "../types";

export function SettingsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Raw server settings
  const [serverSettings, setServerSettings] = useState<SystemSettings | null>(null);

  // Form states
  const [llmProvider, setLlmProvider] = useState<"gemini" | "openai">("gemini");
  
  // Google Gemini state
  const [googleApiKey, setGoogleApiKey] = useState("");
  const [googleModel, setGoogleModel] = useState("gemini-3.1-flash-lite");
  const [customGoogleModel, setCustomGoogleModel] = useState("");
  const [isCustomGoogleModel, setIsCustomGoogleModel] = useState(false);

  // OpenAI / Compatible state
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [openaiBaseUrl, setOpenaiBaseUrl] = useState("");
  const [openaiModel, setOpenaiModel] = useState("gpt-4o-mini");
  const [customOpenaiModel, setCustomOpenaiModel] = useState("");
  const [isCustomOpenaiModel, setIsCustomOpenaiModel] = useState(false);

  // Embeddings state
  const [embeddingProvider, setEmbeddingProvider] = useState<"gemini" | "openai">("gemini");
  const [openaiEmbeddingModel, setOpenaiEmbeddingModel] = useState("text-embedding-3-small");
  const [openaiEmbeddingDimensions, setOpenaiEmbeddingDimensions] = useState<number>(1536);

  // RAG pipeline params
  const [temperature, setTemperature] = useState<number>(0);
  const [retrievalK, setRetrievalK] = useState<number>(10);
  const [doclingServiceUrl, setDoclingServiceUrl] = useState("http://docling-service:8000");

  // Connection test state
  const [testingGemini, setTestingGemini] = useState(false);
  const [testingOpenai, setTestingOpenai] = useState(false);
  const [testGeminiResult, setTestGeminiResult] = useState<TestConnectionResult | null>(null);
  const [testOpenaiResult, setTestOpenaiResult] = useState<TestConnectionResult | null>(null);

  const GEMINI_MODELS = [
    { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite", desc: "Ultra fast, recommended default" },
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", desc: "Fast multimodal reasoning" },
    { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", desc: "Deep analytical reasoning" },
    { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", desc: "Large context window" },
  ];

  const OPENAI_MODELS = [
    { id: "gpt-4o-mini", label: "GPT-4o Mini", desc: "Fast & cost-effective" },
    { id: "gpt-4o", label: "GPT-4o", desc: "High intelligence flagship model" },
    { id: "deepseek-chat", label: "DeepSeek Chat", desc: "DeepSeek V3 / R1 (compatible)" },
    { id: "llama3.3-70b", label: "Llama 3.3 70B", desc: "Open-weights via Groq/Ollama/vLLM" },
  ];

  const OPENAI_BASE_URL_PRESETS = [
    { name: "Official OpenAI", url: "" },
    { name: "Ollama (Local)", url: "http://localhost:11434/v1" },
    { name: "Groq Cloud", url: "https://api.groq.com/openai/v1" },
    { name: "DeepSeek API", url: "https://api.deepseek.com/v1" },
    { name: "vLLM / Local AI", url: "http://localhost:8000/v1" },
  ];

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getSettings();
      setServerSettings(data);

      setLlmProvider(data.llmProvider);
      
      // Check if current google model is in preset list
      const isGeminiPreset = GEMINI_MODELS.some((m) => m.id === data.googleModel);
      if (isGeminiPreset) {
        setGoogleModel(data.googleModel);
        setIsCustomGoogleModel(false);
      } else {
        setGoogleModel("custom");
        setCustomGoogleModel(data.googleModel);
        setIsCustomGoogleModel(true);
      }

      // Check if current openai model is in preset list
      const isOpenaiPreset = OPENAI_MODELS.some((m) => m.id === data.openaiModel);
      if (isOpenaiPreset) {
        setOpenaiModel(data.openaiModel);
        setIsCustomOpenaiModel(false);
      } else {
        setOpenaiModel("custom");
        setCustomOpenaiModel(data.openaiModel);
        setIsCustomOpenaiModel(true);
      }

      setOpenaiBaseUrl(data.openaiBaseUrl || "");
      setEmbeddingProvider(data.embeddingProvider);
      setOpenaiEmbeddingModel(data.openaiEmbeddingModel || "text-embedding-3-small");
      setOpenaiEmbeddingDimensions(data.openaiEmbeddingDimensions || 1536);
      setTemperature(data.temperature ?? 0);
      setRetrievalK(data.retrievalK ?? 10);
      setDoclingServiceUrl(data.doclingServiceUrl || "http://docling-service:8000");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load system settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    const effectiveGoogleModel = isCustomGoogleModel
      ? customGoogleModel.trim() || "gemini-3.1-flash-lite"
      : googleModel;

    const effectiveOpenaiModel = isCustomOpenaiModel
      ? customOpenaiModel.trim() || "gpt-4o-mini"
      : openaiModel;

    try {
      const payload: any = {
        llmProvider,
        googleModel: effectiveGoogleModel,
        openaiModel: effectiveOpenaiModel,
        openaiBaseUrl: openaiBaseUrl.trim(),
        embeddingProvider,
        openaiEmbeddingModel: openaiEmbeddingModel.trim(),
        openaiEmbeddingDimensions: Number(openaiEmbeddingDimensions),
        temperature: Number(temperature),
        retrievalK: Number(retrievalK),
        doclingServiceUrl: doclingServiceUrl.trim(),
      };

      if (googleApiKey.trim()) {
        payload.googleApiKey = googleApiKey.trim();
      }

      if (openaiApiKey.trim()) {
        payload.openaiApiKey = openaiApiKey.trim();
      }

      const res = await adminApi.updateSettings(payload);
      setServerSettings(res.settings);
      setGoogleApiKey("");
      setOpenaiApiKey("");
      setSuccessMsg("Settings saved successfully! Runtime configuration updated immediately.");
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTestGemini = async () => {
    setTestingGemini(true);
    setTestGeminiResult(null);
    try {
      const effectiveModel = isCustomGoogleModel
        ? customGoogleModel.trim() || "gemini-3.1-flash-lite"
        : googleModel;

      const res = await adminApi.testConnection({
        provider: "gemini",
        apiKey: googleApiKey.trim() || undefined,
        model: effectiveModel,
      });
      setTestGeminiResult(res);
    } catch (err: any) {
      setTestGeminiResult({
        success: false,
        error: err.message || "Connection failed",
      });
    } finally {
      setTestingGemini(false);
    }
  };

  const handleTestOpenai = async () => {
    setTestingOpenai(true);
    setTestOpenaiResult(null);
    try {
      const effectiveModel = isCustomOpenaiModel
        ? customOpenaiModel.trim() || "gpt-4o-mini"
        : openaiModel;

      const res = await adminApi.testConnection({
        provider: "openai",
        apiKey: openaiApiKey.trim() || undefined,
        baseUrl: openaiBaseUrl.trim() || undefined,
        model: effectiveModel,
      });
      setTestOpenaiResult(res);
    } catch (err: any) {
      setTestOpenaiResult({
        success: false,
        error: err.message || "Connection failed",
      });
    } finally {
      setTestingOpenai(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="font-body-md text-body-md text-on-surface-variant">Loading system & LLM configuration...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-fade-in pb-12">
      {/* Alert Notifications */}
      {error && <Alert variant="error">{error}</Alert>}
      {successMsg && <Alert variant="success">{successMsg}</Alert>}

      {/* ─── SECTION 1: ACTIVE LLM PROVIDER SELECTION ─── */}
      <Card variant="elevated" className="border-primary/20 bg-surface-container-high/40">
        <Card.Header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/20 text-primary border border-primary/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-title-lg text-title-lg font-bold text-white">Active LLM Provider</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Select the primary Large Language Model engine used for answering queries and reasoning.
              </p>
            </div>
          </div>
          <Badge variant={llmProvider === "gemini" ? "primary" : "default"} className="self-start md:self-auto text-xs px-3 py-1">
            Active: {llmProvider === "gemini" ? "Google Gemini" : "OpenAI / Compatible"}
          </Badge>
        </Card.Header>

        <Card.Body className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Google Gemini Card */}
            <div
              onClick={() => setLlmProvider("gemini")}
              className={`p-5 rounded-2xl cursor-pointer border transition-all duration-200 flex flex-col justify-between space-y-4 ${
                llmProvider === "gemini"
                  ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(124,58,237,0.25)] ring-1 ring-primary/40"
                  : "bg-surface-container-high/30 border-outline-variant/30 hover:border-outline-variant/60 hover:bg-surface-container-high/50"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/30 flex items-center justify-center border border-blue-400/30 text-blue-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-title-md text-white font-semibold flex items-center gap-2">
                      Google Gemini
                      {llmProvider === "gemini" && (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-on-surface-variant">Native Gemini 3.1 & 2.5 Flash/Pro</p>
                  </div>
                </div>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                    llmProvider === "gemini"
                      ? "border-primary bg-primary text-white"
                      : "border-outline-variant/50 bg-transparent text-transparent"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-on-surface-variant pt-2 border-t border-white/5">
                <span>Model: {isCustomGoogleModel ? customGoogleModel || "Custom" : googleModel}</span>
                <span>{serverSettings?.hasGoogleApiKey ? "Key configured" : "Key missing"}</span>
              </div>
            </div>

            {/* OpenAI / Compatible Card */}
            <div
              onClick={() => setLlmProvider("openai")}
              className={`p-5 rounded-2xl cursor-pointer border transition-all duration-200 flex flex-col justify-between space-y-4 ${
                llmProvider === "openai"
                  ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(124,58,237,0.25)] ring-1 ring-primary/40"
                  : "bg-surface-container-high/30 border-outline-variant/30 hover:border-outline-variant/60 hover:bg-surface-container-high/50"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/30 flex items-center justify-center border border-emerald-400/30 text-emerald-400">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-title-md text-white font-semibold flex items-center gap-2">
                      OpenAI & Compatible
                      {llmProvider === "openai" && (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-on-surface-variant">GPT-4o, Ollama, Groq, DeepSeek, vLLM</p>
                  </div>
                </div>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                    llmProvider === "openai"
                      ? "border-primary bg-primary text-white"
                      : "border-outline-variant/50 bg-transparent text-transparent"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-on-surface-variant pt-2 border-t border-white/5">
                <span>Model: {isCustomOpenaiModel ? customOpenaiModel || "Custom" : openaiModel}</span>
                <span>{openaiBaseUrl ? "Custom Endpoint" : "Official API"}</span>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* ─── SECTION 2: GOOGLE GEMINI CONFIGURATION ─── */}
      <Card variant="default" className={llmProvider === "gemini" ? "ring-1 ring-primary/30" : "opacity-90"}>
        <Card.Header>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-title-md text-white font-semibold">Google Gemini Settings</h3>
              <p className="font-body-sm text-xs text-on-surface-variant">
                Configure Gemini API credentials and model variants.
              </p>
            </div>
          </div>
          {serverSettings?.hasGoogleApiKey ? (
            <Badge variant="success" className="text-xs flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Key Configured
            </Badge>
          ) : (
            <Badge variant="warning" className="text-xs text-amber-400 border-amber-500/30">
              Key Missing
            </Badge>
          )}
        </Card.Header>

        <Card.Body className="space-y-6">
          {/* API Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" /> Google API Key
              </label>
              {serverSettings?.hasGoogleApiKey && (
                <span className="text-xs text-on-surface-variant">
                  Current: <code className="text-primary font-mono">{serverSettings.googleApiKeyMasked}</code>
                </span>
              )}
            </div>
            <Input
              type="password"
              placeholder={
                serverSettings?.hasGoogleApiKey
                  ? "Leave blank to keep existing key (or enter new key to replace)"
                  : "Enter Google AI Studio API key (AIzaSy...)"
              }
              value={googleApiKey}
              onChange={(e) => setGoogleApiKey(e.target.value)}
              className="font-mono text-xs"
            />
          </div>

          {/* Model Selector */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
              Gemini Model Selection
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {GEMINI_MODELS.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setGoogleModel(item.id);
                    setIsCustomGoogleModel(false);
                  }}
                  className={`p-3.5 rounded-xl cursor-pointer border transition-all ${
                    !isCustomGoogleModel && googleModel === item.id
                      ? "bg-primary/20 border-primary text-white"
                      : "bg-surface-container-high/30 border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high/60"
                  }`}
                >
                  <div className="font-semibold text-sm text-white">{item.label}</div>
                  <div className="text-xs text-on-surface-variant mt-0.5">{item.desc}</div>
                </div>
              ))}
            </div>

            {/* Custom Model Toggle */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsCustomGoogleModel(!isCustomGoogleModel)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                {isCustomGoogleModel ? "← Choose from standard Gemini presets" : "+ Use custom Gemini model name"}
              </button>
              {isCustomGoogleModel && (
                <div className="mt-2">
                  <Input
                    placeholder="e.g. gemini-2.0-flash-exp"
                    value={customGoogleModel}
                    onChange={(e) => setCustomGoogleModel(e.target.value)}
                    className="text-sm font-mono"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Test Connection Button & Result */}
          <div className="pt-4 border-t border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <Button
              variant="secondary"
              size="sm"
              loading={testingGemini}
              onClick={handleTestGemini}
              icon={<Zap className="w-3.5 h-3.5 text-amber-400" />}
            >
              Test Gemini Connection
            </Button>

            {testGeminiResult && (
              <div className="flex items-center gap-2 text-xs">
                {testGeminiResult.success ? (
                  <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-4 h-4" /> Connected ({testGeminiResult.latencyMs}ms) - &quot;{testGeminiResult.message}&quot;
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-red-400 font-medium">
                    <AlertCircle className="w-4 h-4" /> Error: {testGeminiResult.error}
                  </span>
                )}
              </div>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* ─── SECTION 3: OPENAI & COMPATIBLE CONFIGURATION ─── */}
      <Card variant="default" className={llmProvider === "openai" ? "ring-1 ring-primary/30" : "opacity-90"}>
        <Card.Header>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-title-md text-white font-semibold">OpenAI & Custom Endpoint Settings</h3>
              <p className="font-body-sm text-xs text-on-surface-variant">
                Configure OpenAI, Ollama, Groq, DeepSeek, vLLM, or LM Studio endpoints.
              </p>
            </div>
          </div>
          {serverSettings?.hasOpenaiApiKey || openaiBaseUrl ? (
            <Badge variant="success" className="text-xs flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Configured
            </Badge>
          ) : (
            <Badge variant="warning" className="text-xs text-amber-400 border-amber-500/30">
              Key Missing
            </Badge>
          )}
        </Card.Header>

        <Card.Body className="space-y-6">
          {/* Base URL & Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> OpenAI-Compatible Base URL (Optional)
              </label>
              <span className="text-xs text-on-surface-variant">Leave empty for official OpenAI API</span>
            </div>
            <Input
              placeholder="e.g. http://localhost:11434/v1 or https://api.groq.com/openai/v1"
              value={openaiBaseUrl}
              onChange={(e) => setOpenaiBaseUrl(e.target.value)}
              className="font-mono text-xs"
            />
            {/* Base URL Quick Preset Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[11px] text-on-surface-variant mr-1 self-center">Presets:</span>
              {OPENAI_BASE_URL_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setOpenaiBaseUrl(preset.url)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                    openaiBaseUrl === preset.url
                      ? "bg-primary/20 border-primary text-white"
                      : "bg-surface-container-high/40 border-outline-variant/30 text-on-surface-variant hover:text-white hover:bg-surface-container-high"
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" /> OpenAI API Key
              </label>
              {serverSettings?.hasOpenaiApiKey && (
                <span className="text-xs text-on-surface-variant">
                  Current: <code className="text-primary font-mono">{serverSettings.openaiApiKeyMasked}</code>
                </span>
              )}
            </div>
            <Input
              type="password"
              placeholder={
                serverSettings?.hasOpenaiApiKey
                  ? "Leave blank to keep existing key (or enter new key to replace)"
                  : openaiBaseUrl
                  ? "Optional for local endpoints (Ollama/vLLM) or enter endpoint key"
                  : "Enter OpenAI API key (sk-...)"
              }
              value={openaiApiKey}
              onChange={(e) => setOpenaiApiKey(e.target.value)}
              className="font-mono text-xs"
            />
          </div>

          {/* Model Selector */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
              Model Selection
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {OPENAI_MODELS.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setOpenaiModel(item.id);
                    setIsCustomOpenaiModel(false);
                  }}
                  className={`p-3.5 rounded-xl cursor-pointer border transition-all ${
                    !isCustomOpenaiModel && openaiModel === item.id
                      ? "bg-primary/20 border-primary text-white"
                      : "bg-surface-container-high/30 border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high/60"
                  }`}
                >
                  <div className="font-semibold text-sm text-white">{item.label}</div>
                  <div className="text-xs text-on-surface-variant mt-0.5">{item.desc}</div>
                </div>
              ))}
            </div>

            {/* Custom Model Toggle */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsCustomOpenaiModel(!isCustomOpenaiModel)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                {isCustomOpenaiModel ? "← Choose from standard OpenAI presets" : "+ Use custom model name (e.g. llama3:8b, mistral, qwen)"}
              </button>
              {isCustomOpenaiModel && (
                <div className="mt-2">
                  <Input
                    placeholder="e.g. qwen2.5-coder:32b or claude-3-5-sonnet"
                    value={customOpenaiModel}
                    onChange={(e) => setCustomOpenaiModel(e.target.value)}
                    className="text-sm font-mono"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Test Connection Button & Result */}
          <div className="pt-4 border-t border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <Button
              variant="secondary"
              size="sm"
              loading={testingOpenai}
              onClick={handleTestOpenai}
              icon={<Zap className="w-3.5 h-3.5 text-emerald-400" />}
            >
              Test OpenAI / Endpoint Connection
            </Button>

            {testOpenaiResult && (
              <div className="flex items-center gap-2 text-xs">
                {testOpenaiResult.success ? (
                  <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-4 h-4" /> Connected ({testOpenaiResult.latencyMs}ms) - &quot;{testOpenaiResult.message}&quot;
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-red-400 font-medium">
                    <AlertCircle className="w-4 h-4" /> Error: {testOpenaiResult.error}
                  </span>
                )}
              </div>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* ─── SECTION 4: EMBEDDINGS & VECTOR STORE ─── */}
      <Card variant="default">
        <Card.Header>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-title-md text-white font-semibold">Embeddings & Vector Store Configuration</h3>
              <p className="font-body-sm text-xs text-on-surface-variant">
                Configure embedding models used for vectorizing ingested documents and semantic queries.
              </p>
            </div>
          </div>
        </Card.Header>

        <Card.Body className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Embedding Provider Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                Embedding Provider
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEmbeddingProvider("gemini")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    embeddingProvider === "gemini"
                      ? "bg-primary/20 border-primary text-white"
                      : "bg-surface-container-high/30 border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  <div className="text-xs font-semibold">Google Gemini</div>
                  <div className="text-[11px] opacity-75">gemini-embedding-2 (3072 dims)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setEmbeddingProvider("openai")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    embeddingProvider === "openai"
                      ? "bg-primary/20 border-primary text-white"
                      : "bg-surface-container-high/30 border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  <div className="text-xs font-semibold">OpenAI / Compatible</div>
                  <div className="text-[11px] opacity-75">text-embedding-3 (1536 dims)</div>
                </button>
              </div>
            </div>

            {/* OpenAI Embedding Details (if OpenAI selected) */}
            {embeddingProvider === "openai" ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                    Embedding Model
                  </label>
                  <Input
                    placeholder="text-embedding-3-small"
                    value={openaiEmbeddingModel}
                    onChange={(e) => setOpenaiEmbeddingModel(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                    Vector Dimensions
                  </label>
                  <Input
                    type="number"
                    value={openaiEmbeddingDimensions}
                    onChange={(e) => setOpenaiEmbeddingDimensions(Number(e.target.value))}
                    className="text-xs font-mono"
                  />
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-surface-container-high/30 border border-outline-variant/30 flex items-center justify-center text-xs text-on-surface-variant">
                <span>Google Gemini uses the native <code className="text-white font-mono">gemini-embedding-2</code> model (3072 dimensions).</span>
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">Vector Dimension Migration Note:</strong> Switching embedding providers requires re-ingesting documents if the embedding dimension changes between providers (3072 vs 1536).
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* ─── SECTION 5: RAG & PIPELINE PARAMETERS ─── */}
      <Card variant="default">
        <Card.Header>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-title-md text-white font-semibold">RAG Generation & Retrieval Parameters</h3>
              <p className="font-body-sm text-xs text-on-surface-variant">
                Fine-tune generation temperature, search recall depth, and parser endpoints.
              </p>
            </div>
          </div>
        </Card.Header>

        <Card.Body className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Temperature Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                  Temperature
                </label>
                <span className="text-xs font-mono font-bold text-primary">{temperature.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-primary cursor-pointer h-2 bg-surface-container-high rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[10px] text-on-surface-variant">
                <span>0.0 (Factual / Deterministic)</span>
                <span>1.0 (Creative)</span>
              </div>
            </div>

            {/* Retrieval K */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                Retrieval Top-K Documents
              </label>
              <Input
                type="number"
                min="1"
                max="50"
                value={retrievalK}
                onChange={(e) => setRetrievalK(parseInt(e.target.value) || 10)}
                className="text-sm font-mono"
              />
              <p className="text-[10px] text-on-surface-variant">Number of candidate chunks retrieved before reranking (Default: 10)</p>
            </div>

            {/* Docling Parser Service URL */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                Docling Parser Microservice URL
              </label>
              <Input
                value={doclingServiceUrl}
                onChange={(e) => setDoclingServiceUrl(e.target.value)}
                placeholder="http://docling-service:8000"
                className="text-xs font-mono"
              />
              <p className="text-[10px] text-on-surface-variant">Internal container or remote service parsing endpoint</p>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* ─── STICKY BOTTOM SAVE ACTION BAR ─── */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-high/80 border border-outline-variant/40 backdrop-blur-xl shadow-2xl sticky bottom-4 z-20">
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          <Database className="w-4 h-4 text-primary" />
          <span>Settings are persisted to the database and hot-reloaded automatically.</span>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={fetchSettings}
            disabled={saving}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Reset
          </Button>

          <Button
            variant="primary"
            size="md"
            loading={saving}
            onClick={handleSave}
            icon={<Save className="w-4 h-4" />}
          >
            Save System Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
