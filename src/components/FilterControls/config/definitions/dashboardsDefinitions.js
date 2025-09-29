// web/src/features/widgets/components/WidgetFrom.tsx langfuse github 참고
// Dashboards, Widgets Filter

import { useMemo } from "react";

export const dashboardsFilterDefs = [
  // {
  //   name: "Environment",
  //   id: "environment",
  //   type: "stringOptions",
  //   options: [],
  // },
  {
    name: "Trace Name",
    id: "traceName",
    type: "stringOptions",
    options: [],
    internal: "internalValue",
  },
  {
    name: "Observation Name",
    id: "observationName",
    type: "string",
    internal: "internalValue",
  },
  {
    name: "Score Name",
    id: "scoreName",
    type: "string",
    internal: "internalValue",
  },
  {
    name: "Tags",
    id: "tags",
    type: "arrayOptions",
    options: [],
    internal: "internalValue",
  },
  {
    name: "User",
    id: "user",
    type: "string",
    internal: "internalValue",
  },
  {
    name: "Session",
    id: "session",
    type: "string",
    internal: "internalValue",
  },
  {
    name: "Metadata",
    id: "metadata",
    type: "stringObject",
    internal: "internalValue",
  },
  {
    name: "Release",
    id: "release",
    type: "string",
    internal: "internalValue",
  },
  {
    name: "Version",
    id: "version",
    type: "string",
    internal: "internalValue",
  },
];