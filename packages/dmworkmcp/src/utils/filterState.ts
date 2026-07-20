import type { McpCreatedByType } from "../types/mcp";

export const RESET_FILTERS = {
  keyword: "",
  category: "all",
  createdByTypes: [] as McpCreatedByType[],
};

export function toggleCreatedByType(
  current: McpCreatedByType[],
  value: McpCreatedByType
): McpCreatedByType[] {
  return current.includes(value)
    ? current.filter((source) => source !== value)
    : [...current, value];
}

export function countActiveFilters(
  keyword: string,
  category: string,
  createdByTypes: McpCreatedByType[]
): number {
  return (
    (keyword ? 1 : 0) + (category === "all" ? 0 : 1) + createdByTypes.length
  );
}
