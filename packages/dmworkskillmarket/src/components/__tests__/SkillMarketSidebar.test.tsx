import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import SkillMarketSidebar from "../SkillMarketSidebar";

describe("SkillMarketSidebar", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/");
  });

  it("restores the my-created tab from the URL hash", () => {
    window.history.replaceState(null, "", "/#mine");

    render(<SkillMarketSidebar />);

    expect(screen.getByRole("button", { name: /我创建/ })).toHaveClass("is-active");
  });

  it("updates the URL hash when switching tabs", () => {
    render(<SkillMarketSidebar />);

    fireEvent.click(screen.getByRole("button", { name: /我创建/ }));

    expect(window.location.hash).toBe("#mine");
  });
});
