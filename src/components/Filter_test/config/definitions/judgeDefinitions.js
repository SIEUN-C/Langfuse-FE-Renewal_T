export const judgeFilterDefs = [
  {
    name: "Status",
    id: "status",
    type: "stringOptions",
    internal: 'jc."status"::text',
    options: Object.values(JobConfigState).map((value) => ({ value })),
  },
  {
    name: "Target",
    id: "target",
    type: "stringOptions",
    internal: 'jc."target_object"',
    options: [{ value: "trace" }, { value: "dataset" }],
  },
];