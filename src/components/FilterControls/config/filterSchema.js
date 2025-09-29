// src/features/filters/config/filterSchema.js
import { z } from "zod";
import { filterOperators } from "./filterOperators";

// 각 타입별 필터 객체의 구조(Schema)를 정의
const timeFilter = z.object({
  column: z.string(),
  operator: z.enum(filterOperators.datetime),
  value: z.coerce.date(), // coerce required to parse stringified dates from the db in evals
  type: z.literal("datetime"),
});

const stringFilter = z.object({
  column: z.string(),
  operator: z.enum(filterOperators.string),
  value: z.string(),
  type: z.literal("string"),
});

const numberFilter = z.object({
  column: z.string(),
  operator: z.enum(filterOperators.number),
  value: z.number(),
  type: z.literal("number"),
});

const stringOptionsFilter = z.object({
  column: z.string(),
  operator: z.enum(filterOperators.stringOptions),
  // do not filter on empty arrays, use refine to check this only at runtime (no type checking)
  value: z.array(z.string()).refine((v) => v.length > 0),
  type: z.literal("stringOptions"),
});

const arrayOptionsFilter = z.object({
  column: z.string(),
  operator: z.enum(filterOperators.arrayOptions),
  value: z.array(z.string()).refine((v) => v.length > 0),
  type: z.literal("arrayOptions"),
});

const stringObjectFilter = z.object({
  type: z.literal("stringObject"),
  column: z.string(),
  key: z.string(), // eg metadata --> "environment"
  operator: z.enum(filterOperators.string),
  value: z.string(),
});

const numberObjectFilter = z.object({
  type: z.literal("numberObject"),
  column: z.string(),
  key: z.string(), // eg scores --> "accuracy"
  operator: z.enum(filterOperators.number),
  value: z.number(),
});

const booleanFilter = z.object({
  type: z.literal("boolean"),
  column: z.string(),
  operator: z.enum(filterOperators.boolean),
  value: z.boolean(),
});

const nullFilter = z.object({
  type: z.literal("null"),
  column: z.string(),
  operator: z.enum(filterOperators.null),
  value: z.literal(""),
});

const categoryOptionsFilter = z.object({
  type: z.literal("categoryOptions"),
  column: z.string(),
  key: z.string(),
  operator: z.enum(filterOperators.categoryOptions),
  value: z.array(z.string()),
});

const singleFilter = z.discriminatedUnion("type", [
  timeFilter,
  stringFilter,
  numberFilter,
  stringOptionsFilter,
  categoryOptionsFilter,
  arrayOptionsFilter,
  stringObjectFilter,
  numberObjectFilter,
  booleanFilter,
  nullFilter,
]);

// 필터 배열 전체에 대한 유효성 검사
export const filterState = z.array(singleFilter);