export const filterOperators = {
  datetime: [">", "<", ">=", "<="],
  string: ["=", "contains", "does not contain", "starts with", "ends with"],
  stringOptions: ["any of", "none of"],
  categoryOptions: ["any of", "none of"],
  arrayOptions: ["any of", "none of", "all of"],
  number: ["=", ">", "<", ">=", "<="],
  stringObject: ["=", "contains", "does not contain", "starts with", "ends with"],
  numberObject: ["=", ">", "<", ">=", "<="],
  boolean: ["=", "<>"],
  null: ["is null", "is not null"],
};