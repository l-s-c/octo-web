// @vitest-environment jsdom
import React from "react";
import ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@octo/base", () => ({ t: (key: string) => key }));

import CreatedByBadge, { getCreatorInitial } from "../CreatedByBadge";

let container: HTMLDivElement | null = null;

afterEach(() => {
  if (container) {
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
    container = null;
  }
});

function renderBadge(type: "human" | "bot", name: string): HTMLElement {
  container = document.createElement("div");
  document.body.appendChild(container);
  act(() => {
    ReactDOM.render(<CreatedByBadge type={type} name={name} />, container);
  });
  return container;
}

describe("CreatedByBadge", () => {
  it("renders a human initial avatar and exposes source + name to assistive tech", () => {
    const root = renderBadge("human", "Ada");
    expect(
      root.querySelector('[aria-label="mcp.source.human：Ada"]')
    ).toBeTruthy();
    expect(root.querySelector(".wk-mcp-source__avatar")?.textContent).toBe("A");
    expect(
      root.querySelector(".wk-mcp-source__avatar")?.getAttribute("aria-hidden")
    ).toBe("true");
  });

  it("keeps non-human icons decorative while the label remains complete", () => {
    const root = renderBadge("bot", "Build Bot");
    expect(
      root.querySelector('[aria-label="mcp.source.bot：Build Bot"]')
    ).toBeTruthy();
    const icon = Array.from(root.querySelectorAll("span")).find(
      (element) => element.textContent === "🤖"
    );
    expect(icon?.getAttribute("aria-hidden")).toBe("true");
  });

  it("falls back for empty creator names", () => {
    expect(getCreatorInitial(" ")).toBe("?");
  });
});
