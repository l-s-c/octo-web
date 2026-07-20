import { describe, expect, it } from "vitest";
import type { McpListItem } from "../types/mcp";
import { filterMcpItems } from "../utils/sourceFilter";

const fixtures: McpListItem[] = [
  {
    id: "1",
    name: "GitHub",
    slogan: "code",
    category: "dev",
    tags: [],
    toolCount: 1,
    icon: "",
    createdByType: "bot",
    createdByName: "Bot",
  },
  {
    id: "2",
    name: "Postgres",
    slogan: "data",
    category: "data",
    tags: [],
    toolCount: 1,
    icon: "",
    createdByType: "human",
    createdByName: "Ada",
  },
  {
    id: "3",
    name: "Git Import",
    slogan: "code",
    category: "dev",
    tags: [],
    toolCount: 1,
    icon: "",
    createdByType: "import",
    createdByName: "Repo",
  },
];

describe("mock MCP source filtering", () => {
  it("ORs selected sources and ANDs them with category and keyword", () => {
    expect(
      filterMcpItems(fixtures, {
        keyword: "git",
        category: "dev",
        createdByTypes: ["bot", "import"],
      }).map((item) => item.id)
    ).toEqual(["1", "3"]);

    expect(
      filterMcpItems(fixtures, {
        category: "data",
        createdByTypes: ["bot", "import"],
      })
    ).toEqual([]);
  });
});
