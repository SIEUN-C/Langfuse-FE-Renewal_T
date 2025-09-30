// components/FilterControls/config/definitions/traceDefinitions.js

export const tracesFilterDefs = [
  {
    name: "⭐️",
    id: "bookmarked",
    type: "boolean",
    internal: "t.bookmarked",
  },
  {
    name: "ID",
    id: "id",
    type: "string",
    internal: "t.id"
  },
  {
    name: "Name",
    id: "name",
    type: "stringOptions",
    internal: 't."name"',
    options: [], // 런타임에 채워짐
  },
  // {
  //   name: "Environment",
  //   id: "environment",
  //   type: "stringOptions",
  //   internal: 't."environment"',
  //   options: [], // 런타임에 채워짐
  // },
  {
    name: "Timestamp",
    id: "timestamp",
    type: "datetime",
    internal: 't."timestamp"',
  },
  {
    name: "User ID",
    id: "userId",
    type: "string",
    internal: 't."user_id"',
  },
  {
    name: "Session ID",
    id: "sessionId",
    type: "string",
    internal: 't."session_id"',
  },
  {
    name: "Metadata",
    id: "metadata",
    type: "stringObject",
    internal: 't."metadata"',
  },
  {
    name: "Version",
    id: "version",
    type: "string",
    internal: 't."version"',
  },
  {
    name: "Release",
    id: "release",
    type: "string",
    internal: 't."release"',
  },
  {
    name: "Level",
    id: "level",
    type: "stringOptions",
    internal: '"level"',
    options: [
      { value: "DEBUG" },
      { value: "DEFAULT" },
      { value: "WARNING" },
      { value: "ERROR" },
    ],
  },
  {
    name: "Tags",
    id: "tags",
    type: "arrayOptions",
    internal: 't."tags"',
    options: [], // 런타임에 채워짐
  },
  {
    name: "Input Tokens",
    id: "inputTokens",
    type: "number",
    internal: 'generation_metrics."promptTokens"',
  },
  {
    name: "Output Tokens",
    id: "outputTokens",
    type: "number",
    internal: 'generation_metrics."completionTokens"',
  },
  {
    name: "Total Tokens",
    id: "totalTokens",
    type: "number",
    internal: 'generation_metrics."totalTokens"',
  },
  {
    name: "Error Level Count",
    id: "errorCount",
    type: "number",
    internal: 'generation_metrics."errorCount"',
  },
  {
    name: "Warning Level Count",
    id: "warningCount",
    type: "number",
    internal: 'generation_metrics."warningCount"',
  },
  {
    name: "Default Level Count",
    id: "defaultCount",
    type: "number",
    internal: 'generation_metrics."defaultCount"',
  },
  {
    name: "Debug Level Count",
    id: "debugCount",
    type: "number",
    internal: 'generation_metrics."debugCount"',
  },
  {
    name: "Scores (numeric)",
    id: "scores_avg",
    type: "numberObject",
    internal: "scores_avg",
  },
  {
    name: "Scores (categorical)",
    id: "score_categories",
    type: "categoryOptions",
    internal: "score_categories",
    options: [], // 런타임에 채워짐
  },
  {
    name: "Latency (s)",
    id: "latency",
    type: "number",
    internal: "observation_metrics.latency",
  },
  {
    name: "Input Cost ($)",
    id: "inputCost",
    type: "number",
    internal: '"calculatedInputCost"',
  },
  {
    name: "Output Cost ($)",
    id: "outputCost",
    type: "number",
    internal: '"calculatedOutputCost"',
  },
  {
    name: "Total Cost ($)",
    id: "totalCost",
    type: "number",
    internal: '"calculatedTotalCost"',
  },
];