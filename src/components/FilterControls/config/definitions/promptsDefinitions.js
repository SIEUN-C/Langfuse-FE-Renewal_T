export const promptsFilterDefs = (PromptType) => [
  {
    name: "Name",
    id: "name",
    type: "string",
    internal: 'p."name"',
  },
  {
    name: "Version",
    id: "version",
    type: "number",
    internal: 'p."version"',
  },
  {
    name: "Created At",
    id: "createdAt",
    type: "datetime",
    internal: 'p."created_at"',
  },
  {
    name: "Updated At",
    id: "updatedAt",
    type: "datetime",
    internal: 'p."updated_at"',
  },
  {
    name: "Type",
    id: "type",
    type: "stringOptions",
    internal: 'p."type"',
    options: Object.values(PromptType).map((value) => ({ value })),
  },
  {
    name: "Labels",
    id: "labels",
    type: "arrayOptions",
    internal: 'p."labels"',
    options: [], // to be added at runtime
  },
  {
    name: "Tags",
    id: "tags",
    type: "arrayOptions",
    internal: 'p."tags"',
    options: [], // to be added at runtime
  },
  {
    name: "Config",
    id: "config",
    type: "stringObject",
    internal: 'p."config"',
  },
];