import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SkillListPage from "../SkillListPage";
import * as api from "../../api/skillApi";
import type { Category, Skill } from "../../types/skill";

const categories: Category[] = [
  { id: "all", name: "全部", iconKey: "LayoutGrid", sortOrder: 99, skillCount: 1 },
  { id: "office", name: "办公协作", iconKey: "FolderKanban", sortOrder: 1, skillCount: 1 },
];

const skill: Skill = {
  id: "meeting-note-cleaner",
  name: "meeting-note-cleaner",
  description: "将会议纪要整理为决策、待办、风险和引用资料。",
  categoryId: "office",
  tags: ["纪要", "协作"],
  ownerId: "me",
  ownerName: "我",
  spaceId: "space-demo",
  visibility: "space",
  version: "1.1.3",
  readmeContent: "# meeting-note-cleaner\n\n- 输出待办",
  fileName: "meeting-note-cleaner.zip",
  fileUrl: "mock://skills/meeting-note-cleaner.zip",
  fileSize: 4096,
  createdAt: "2026-06-01T08:00:00.000Z",
  updatedAt: "2026-07-10T08:00:00.000Z",
};

vi.mock("../../api/skillApi");

describe("SkillListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getCategories).mockResolvedValue(categories);
    vi.mocked(api.getSkills).mockResolvedValue({ items: [skill], nextCursor: null });
    vi.mocked(api.getMySkills).mockResolvedValue({ items: [skill], nextCursor: null });
    vi.mocked(api.getSkill).mockResolvedValue(skill);
    vi.mocked(api.deleteSkill).mockResolvedValue();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("hides category chips on the my-created page and shows owner actions", async () => {
    render(<SkillListPage mine />);

    expect(screen.queryByLabelText("Skill 分类")).not.toBeInTheDocument();
    expect(await screen.findByText("meeting-note-cleaner")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "编辑 meeting-note-cleaner" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "删除 meeting-note-cleaner" })).toBeInTheDocument();
  });

  it("debounces search by 300ms before reloading the list", async () => {
    vi.useFakeTimers();
    render(<SkillListPage />);

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });

    vi.mocked(api.getSkills).mockClear();
    fireEvent.change(screen.getByPlaceholderText("搜索"), { target: { value: "ci" } });
    expect(api.getSkills).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(300);
      await vi.runOnlyPendingTimersAsync();
    });

    expect(api.getSkills).toHaveBeenCalledWith({ q: "ci", categoryId: "all", cursor: undefined, limit: 20 });
  });

  it("confirms deletion and removes the skill through the API", async () => {
    render(<SkillListPage mine />);

    fireEvent.click(await screen.findByRole("button", { name: "删除 meeting-note-cleaner" }));
    expect(screen.getByText("确定删除「meeting-note-cleaner」？")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "删除" }));

    await waitFor(() => expect(api.deleteSkill).toHaveBeenCalledWith("meeting-note-cleaner"));
  });
});
