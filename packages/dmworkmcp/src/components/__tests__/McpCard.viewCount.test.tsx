// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@octo/base", () => ({ t: (_key: string, options?: { values?: { count?: number } }) => `views:${options?.values?.count ?? ""}` }));
vi.mock("@douyinfe/semi-ui", () => ({ Tooltip: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("../../utils/icon", () => ({ IconGlyph: () => null }));

import McpCard from "../McpCard";

describe("McpCard view count", () => {
  it("renders the compact count with an accessible label", () => {
    render(
      <McpCard
        item={{ id: "m1", name: "MCP", slogan: "", category: "dev", tags: [], toolCount: 2, viewCount: 1250, icon: "" }}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByLabelText("views:1250")).toHaveTextContent("1.3K");
  });
});
