// src/Pages/Widget/services/filters.js
import { ApiClient } from "./apiClient.js";
import { fetchMetrics, toISO, autoGranularity } from "./metricsApi.js";

/** (1) 프리셋 */
const PRESET_TRACES = [
  { id: "environment", name: "Environment", type: "stringOptions" },
  { id: "name", name: "Trace Name", type: "string" },
  { id: "observationName", name: "Observation Name", type: "string" },
  { id: "scoreName", name: "Score Name", type: "string" },
  { id: "tags", name: "Tags", type: "arrayOptions" },
  { id: "userId", name: "User", type: "stringOptions" },
  { id: "sessionId", name: "Session", type: "stringOptions" },
  { id: "metadata", name: "Metadata", type: "string" },
  { id: "release", name: "Release", type: "stringOptions" },
  { id: "version", name: "Version", type: "stringOptions" },
];

const PRESETS = {
  traces: PRESET_TRACES,
  observations: [
    { id: "name", name: "Name", type: "string" },
    { id: "type", name: "Type", type: "stringOptions" },
    { id: "model", name: "Model", type: "stringOptions" },
    { id: "environment", name: "Environment", type: "stringOptions" },
  ],
  scores: [
    { id: "name", name: "Score Name", type: "string" },
    { id: "value", name: "Value", type: "number" },
    { id: "source", name: "Source", type: "stringOptions" },
  ],
};

/** (2) 별칭 */
const DIMENSION_ALIAS = {
  user: "userId",
  session: "sessionId",
  traceName: "name",
};
const normalizeField = (col) => DIMENSION_ALIAS[col] ?? col;

/** (3) 서버 제공 옵션 우선 */
async function fetchServerProvidedOptions(api, view, field) {
  const f = normalizeField(field);

  if (f === "environment") {
    try {
      const res = await api.trpcGet("projects.environmentFilterOptions", {});
      return Array.isArray(res) ? res : null;
    } catch {}
  }

  if (view === "traces") {
    try {
      const res = await api.trpcGet("traces.filterOptions", {});
      if (f === "tags" && Array.isArray(res?.tags)) return res.tags;
      if (f === "userId" && Array.isArray(res?.users)) return res.users;
      if (f === "sessionId" && Array.isArray(res?.sessions))
        return res.sessions;
      if (f === "release" && Array.isArray(res?.releases)) return res.releases;
      if (f === "version" && Array.isArray(res?.versions)) return res.versions;
    } catch {}
  }
  return null;
}

/** (4) Distinct 값 */
async function fetchDistinctValues(
  api,
  { view, column, search = "", limit = 50, from, to }
) {
  const dimField = normalizeField(column);

  const serverVals = await fetchServerProvidedOptions(api, view, dimField);
  if (serverVals) {
    const arr = serverVals.map((v) => String(v)).filter(Boolean);
    return (
      search
        ? arr.filter((v) => v.toLowerCase().includes(search.toLowerCase()))
        : arr
    ).slice(0, limit);
  }

  // Metrics API 시도
  try {
    const fromISO = toISO(from || new Date(Date.now() - 7 * 86400000));
    const toISO_ = toISO(to || new Date());
    const gran = autoGranularity(fromISO, toISO_);

    const params = {
      view,
      metrics: [{ measure: "count", aggregation: "count" }],
      dimensions: [{ field: dimField }],
      filters: [],
      timeDimension: { granularity: gran },
      fromTimestamp: fromISO,
      toTimestamp: toISO_,
      limit,
    };

    const json = await fetchMetrics(params);
    const rows = Array.isArray(json?.data) ? json.data : [];

    const pickLabel = (row) =>
      row?.[dimField] ??
      row?.[column] ??
      row?.dimension ??
      row?.name ??
      Object.values(row).find((v) => typeof v === "string") ??
      "";

    let values = rows.map(pickLabel).filter(Boolean).map(String);
    values = [...new Set(values)];
    if (search)
      values = values.filter((v) =>
        v.toLowerCase().includes(search.toLowerCase())
      );
    return values.slice(0, limit);
  } catch (err) {
    console.warn(
      "Metrics API failed, fallback to executeQuery:",
      err?.message || err
    );
  }

  // dashboard.executeQuery fallback (tags 제외)
  if (dimField === "tags") return [];

  try {
    const fromISO = toISO(from || new Date(Date.now() - 30 * 86400000));
    const toISO_ = toISO(to || new Date());

    const data = await api.trpcGet("dashboard.executeQuery", {
      query: {
        view,
        dimensions: [{ field: dimField }],
        metrics: [{ measure: "count", aggregation: "count" }],
        filters: [],
        timeDimension: { granularity: "auto" },
        fromTimestamp: fromISO,
        toTimestamp: toISO_,
      },
    });

    const raw =
      data?.chartData ||
      data?.data ||
      data?.series ||
      data?.results ||
      data?.rows ||
      data?.items ||
      [];

    let vals = Array.isArray(raw)
      ? raw
          .map((r, i) =>
            Array.isArray(r)
              ? r[0]
              : r?.x ??
                r?.name ??
                r?.[dimField] ??
                r?.[column] ??
                `Row ${i + 1}`
          )
          .filter(Boolean)
      : [];

    vals = [...new Set(vals.map(String))];
    if (search)
      vals = vals.filter((v) => v.toLowerCase().includes(search.toLowerCase()));
    return vals.slice(0, limit);
  } catch (error) {
    console.warn("Fallback executeQuery failed:", error);
    return [];
  }
}

/** (5) 연산자 매핑 */
const OP_MAP = {
  is: "=",
  "=": "=",
  "is equal to": "=",
  "is not": "!=",
  "!=": "!=",
  contains: "CONTAINS",
  "does not contain": "NOT_CONTAINS",
  in: "IN",
  "not in": "NOT_IN",
  ">": ">",
  "<": "<",
  ">=": ">=",
  "<=": "<=",
};

export class FiltersAPI extends ApiClient {
  async getFilterColumns(view = "traces") {
    const columns = PRESETS[view] || PRESETS.traces;
    return { success: true, data: columns };
  }

  async getOptions(view = "traces", { searchByColumn = {}, limit = 50 } = {}) {
    const preset = PRESETS[view] || PRESETS.traces;
    const optionColumns = preset.filter((c) =>
      ["stringOptions", "arrayOptions", "categoryOptions"].includes(c.type)
    );

    const entries = await Promise.all(
      optionColumns.map(async (col) => {
        const search = searchByColumn[col.id] ?? "";
        const list = await fetchDistinctValues(this, {
          view,
          column: col.id,
          search,
          limit,
        });
        const options = list.map((v) => ({ value: String(v) }));
        return [col.id, options];
      })
    );

    return Object.fromEntries(entries);
  }

  async getFilterValues({ view = "traces", column, search = "", limit = 50 }) {
    if (!column) return [];
    return fetchDistinctValues(this, { view, column, search, limit });
  }

  serializeFilters(filters = [], columns = []) {
    if (!Array.isArray(filters)) return [];

    const colMeta = Object.fromEntries(
      (columns || []).map((c) => [c.id || c.column || c.name, c])
    );

    const out = filters
      .map((f) => {
        const rawCol = f.column || f.id || f.field || f.columnId || f.name;
        const column = normalizeField(rawCol);
        const opKey = (f.operator || f.op || "").toString().toLowerCase();
        const operator = OP_MAP[opKey] || "CONTAINS";

        let value =
          f.values ?? f.value ?? f.val ?? (f.list ? [...f.list] : undefined);

        if (
          (operator === "IN" || operator === "NOT_IN") &&
          typeof value === "string"
        ) {
          value = value
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        }

        const type = colMeta[rawCol]?.type || "string";
        if (type === "arrayOptions" && !Array.isArray(value))
          value = value != null ? [value] : [];

        const isEmpty =
          value == null ||
          (typeof value === "string" && value.trim() === "") ||
          (Array.isArray(value) && value.length === 0);
        if (isEmpty) return null;

        return { column, operator, value };
      })
      .filter((f) => f && f.column && f.operator);

    const seen = new Set();
    return out.filter((f) => {
      const key = JSON.stringify(f);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
