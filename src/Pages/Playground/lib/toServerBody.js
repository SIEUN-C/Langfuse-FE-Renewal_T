export default function toServerBody({
    projectId,
    messages,
    schema,        // {id,name,schema} | null
    streaming,
    modelAdv,      // UI 상태 (useState)
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
            type: toType(m.role),
            role: toRole(m.role),
            content: (m.content || "").trim(),
        }));

    const mp = {
        provider: selectedProvider,
        adapter: selectedAdapter,
        model: selectedModel,
        ...(modelAdv.useTemperature ? { temperature: Number(modelAdv.temperature) } : {}),
        ...(modelAdv.useTopP ? { topP: Number(modelAdv.topP) } : {}),
        ...(modelAdv.useMaxTokens ? { maxTokens: parseInt(modelAdv.maxTokens, 10) } : {}),
        ...(modelAdv.useFrequencyPenalty ? { frequencyPenalty: Number(modelAdv.frequencyPenalty) } : {}),
        ...(modelAdv.usePresencePenalty ? { presencePenalty: Number(modelAdv.presencePenalty) } : {}),
    };

    const stops = (modelAdv.stopInput || "")
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean);
    if (stops.length) mp.stop = stops;

    if ((modelAdv.apiKeyOverride || "").trim()) {
        mp.apiKeyOverride = modelAdv.apiKeyOverride.trim();
    }

    return {
        projectId,
        messages: chat,
        modelParams: mp,
        streaming: !!streaming,
        outputSchema: schema ? { id: schema.id, name: schema.name, schema: schema.schema || {} } : null,
    };
}
