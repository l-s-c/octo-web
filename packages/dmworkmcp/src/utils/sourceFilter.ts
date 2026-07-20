import type { ListMcpParams, McpListItem } from "../types/mcp";

export function filterMcpItems(
  source: McpListItem[],
  params: ListMcpParams
): McpListItem[] {
  const keyword = (params.keyword ?? "").trim().toLowerCase();
  const category = params.category ?? "all";
  const createdByTypes = params.createdByTypes ?? [];
  return source.filter((item) => {
    const matchCategory = category === "all" || item.category === category;
    const matchSource =
      createdByTypes.length === 0 ||
      (item.createdByType !== undefined &&
        createdByTypes.includes(item.createdByType));
    const matchKeyword =
      !keyword ||
      item.name.toLowerCase().includes(keyword) ||
      item.slogan.toLowerCase().includes(keyword);
    return matchCategory && matchSource && matchKeyword;
  });
}
