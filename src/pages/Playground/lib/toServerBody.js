// src/Pages/Playground/lib/toServerBody.js

const ADAPTER_OUT_MAP = {
  vertex: "google-ai-studio",
  "azure-openai": "azure",
};

export default function toServerBody({
  projectId,
  messages,
  schema,
  streaming,
  modelAdv,
  selectedProvider,
  selectedAdapter,
  selectedModel,
}) {
  const toRole = (role) => (role || "user").toLowerCase();
  const toType = (role) => {
    const r = toRole(role);
    if (r === "assistant") return "assistant";
    if (r === "system") return "system";
    if (r === "developer") return "developer";
    return "user";
  };

  const chat = (messages || [])
    .filter((m) => m.kind !== "placeholder" && m.role !== "Placeholder")
    .map((m) => ({
      id: m.id,
      type: toType(m.role),
      role: toRole(m.role),
      content: (m.content || "").trim(),
    }));

  const adapterForServer =
    ADAPTER_OUT_MAP[(selectedAdapter || "").toLowerCase()] || selectedAdapter;

  const mp = {
    provider: (selectedProvider || "").trim(),
    adapter: adapterForServer,
    model: (selectedModel || "").trim(),
    ...(modelAdv?.useTemperature ? { temperature: Number(modelAdv.temperature) } : {}),
    ...(modelAdv?.useTopP ? { top_p: Number(modelAdv.topP) } : {}),
    ...(modelAdv?.useMaxTokens ? { max_tokens: parseInt(modelAdv.maxTokens, 10) } : {}),
    ...(modelAdv?.useFrequencyPenalty ? { frequencyPenalty: Number(modelAdv.frequencyPenalty) } : {}),
    ...(modelAdv?.usePresencePenalty ? { presencePenalty: Number(modelAdv.presencePenalty) } : {}),
  };

  // additionalOptions 로직 (안전하게 유지)
  if (
    modelAdv?.additionalOptions &&
    typeof modelAdv.additionalOptionsValue === 'string' &&
    modelAdv.additionalOptionsValue.trim()
  ) {
    try {
      const providerOptions = JSON.parse(modelAdv.additionalOptionsValue);
      mp.providerOptions = providerOptions;
    } catch (error) {
      console.error(
        "Playground - Error parsing additionalOptions JSON:",
        error
      );
    }
  }

  // --- START: trim() 오류 최종 수정 ---

  // 1. stopInput을 안전하게 처리합니다.
  const stopInput = modelAdv?.stopInput;
  if (typeof stopInput === 'string' && stopInput.trim()) {
    const stops = stopInput.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
    if (stops.length) {
      mp.stop = stops;
    }
  }

  // 2. apiKeyOverride를 안전하게 처리합니다.
  const apiKeyOverride = modelAdv?.apiKeyOverride;
  if (typeof apiKeyOverride === 'string' && apiKeyOverride.trim()) {
    mp.apiKeyOverride = apiKeyOverride.trim();
  }

  // --- END: trim() 오류 최종 수정 ---

  return {
    projectId,
    messages: chat,
    modelParams: mp,
    streaming: !!streaming,
    outputSchema: schema ?
      { id: schema.id, name: schema.name, schema: schema.schema || {} } :
      null,
  };
}