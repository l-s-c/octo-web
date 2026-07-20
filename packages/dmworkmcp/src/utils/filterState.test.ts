import { describe, expect, it } from "vitest";
import {
  countActiveFilters,
  RESET_FILTERS,
  toggleCreatedByType,
} from "./filterState";

describe("MCP source filter state", () => {
  it("supports selecting and removing multiple sources", () => {
    expect(toggleCreatedByType([], "human")).toEqual(["human"]);
    expect(toggleCreatedByType(["human"], "bot")).toEqual(["human", "bot"]);
    expect(toggleCreatedByType(["human", "bot"], "human")).toEqual(["bot"]);
  });

  it("counts visible conditions for the recoverable empty state", () => {
    expect(countActiveFilters("github", "dev", ["human", "bot"])).toBe(4);
    expect(countActiveFilters("", "all", [])).toBe(0);
  });

  it("defines a source-free reset used when the filter UI is hidden", () => {
    expect(RESET_FILTERS).toEqual({
      keyword: "",
      category: "all",
      createdByTypes: [],
    });
  });
});
