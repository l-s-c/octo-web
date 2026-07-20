// @vitest-environment jsdom
import React from "react";
import ReactDOM from "react-dom";
import { act, Simulate } from "react-dom/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@octo/base", () => ({ t: (key: string) => key }));
vi.mock("../../utils/icon", () => ({ IconGlyph: () => null }));

import TagMultiInput from "../TagMultiInput";
import { MatchReasons } from "../McpCard";
import { parseMcpListQuery, serializeMcpListQuery } from "../../pages/mcpListQuery";

let container: HTMLDivElement | null = null;
afterEach(() => { if (container) { ReactDOM.unmountComponentAtNode(container); container.remove(); container = null; } });
const mount = (node: React.ReactElement) => { container = document.createElement("div"); document.body.appendChild(container); act(() => ReactDOM.render(node, container)); return container; };

describe("MCP list filters and reasons", () => {
  it("accepts two tags through real comma keyboard input and emits two query keys", () => {
    const commit = vi.fn(); const root = mount(<TagMultiInput tags={[]} placeholder="tags" onCommit={commit} />); const input = root.querySelector("input")!;
    act(() => Simulate.change(input, { target: { value: "browser," } }));
    expect(input.value).toBe("browser,");
    act(() => Simulate.change(input, { target: { value: "browser,github" } }));
    act(() => Simulate.keyDown(input, { key: "Enter" }));
    expect(commit).toHaveBeenLastCalledWith(["browser", "github"]);
    const state = { ...parseMcpListQuery(""), tags: commit.mock.calls.at(-1)![0] };
    expect(new URLSearchParams(serializeMcpListQuery(state)).getAll("tag")).toEqual(["browser", "github"]);
  });

  it("renders all five structured reason types and highlights values", () => {
    const root = mount(<MatchReasons keyword="issue" reasons={["tool:create_issue", "tag:issue", "category", "usage_example", "creator:issue team"]} />);
    expect(root.textContent).toContain("mcp.card.matchReason.tool create_issue");
    expect(root.textContent).toContain("mcp.card.matchReason.tag issue");
    expect(root.textContent).toContain("mcp.card.matchReason.category");
    expect(root.textContent).toContain("mcp.card.matchReason.usage");
    expect(root.textContent).toContain("mcp.card.matchReason.creator issue team");
    expect(Array.from(root.querySelectorAll("mark")).map((node) => node.textContent)).toEqual(["issue", "issue", "issue", "issue", "issue"]);
  });
});
