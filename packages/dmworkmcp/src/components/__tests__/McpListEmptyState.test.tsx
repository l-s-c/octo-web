// @vitest-environment jsdom
import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@octo/base", () => ({
  t: (key: string, options?: { values?: { count?: number } }) =>
    options?.values?.count === undefined
      ? key
      : `${key}:${options.values.count}`,
  WKButton: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick: () => void;
  }) => <button onClick={onClick}>{children}</button>,
}));

import McpListEmptyState from "../McpListEmptyState";

let container: HTMLDivElement | null = null;

afterEach(() => {
  if (container) {
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
    container = null;
  }
});

function renderEmptyState(activeFilterCount: number) {
  const onClearFilters = vi.fn();
  const onCreate = vi.fn();
  container = document.createElement("div");
  document.body.appendChild(container);
  act(() => {
    ReactDOM.render(
      <McpListEmptyState
        activeFilterCount={activeFilterCount}
        onClearFilters={onClearFilters}
        onCreate={onCreate}
      />,
      container
    );
  });
  return { root: container, onClearFilters, onCreate };
}

function click(root: HTMLElement, text: string) {
  const button = Array.from(root.querySelectorAll("button")).find(
    (item) => item.textContent === text
  );
  if (!button) throw new Error(`button not found: ${text}`);
  act(() => button.click());
}

describe("McpListEmptyState page branches", () => {
  it("shows filter recovery only when filters are active", () => {
    const { root, onClearFilters, onCreate } = renderEmptyState(2);
    expect(root.textContent).toContain("mcp.list.empty");
    expect(root.textContent).toContain("mcp.list.activeFilters:2");
    expect(root.textContent).not.toContain("mcp.list.noDataHint");
    click(root, "mcp.list.clearFilters");
    expect(onClearFilters).toHaveBeenCalledOnce();
    expect(onCreate).not.toHaveBeenCalled();
  });

  it("shows a working create action without invalid filter controls when data is empty", () => {
    const { root, onClearFilters, onCreate } = renderEmptyState(0);
    expect(root.textContent).toContain("mcp.list.noData");
    expect(root.textContent).toContain("mcp.list.noDataHint");
    expect(root.textContent).not.toContain("mcp.list.activeFilters");
    expect(root.textContent).not.toContain("mcp.list.clearFilters");
    click(root, "mcp.list.create");
    expect(onCreate).toHaveBeenCalledOnce();
    expect(onClearFilters).not.toHaveBeenCalled();
  });
});
