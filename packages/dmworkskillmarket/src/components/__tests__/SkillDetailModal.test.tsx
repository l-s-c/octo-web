import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SkillDetailModal from "../SkillDetailModal";
import * as api from "../../api/skillApi";
import type { Category, Skill } from "../../types/skill";

const categories: Category[] = [
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

describe("SkillDetailModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getSkill).mockResolvedValue(skill);
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("copies the package link and opens the backend download URL", async () => {
    vi.mocked(api.downloadSkill).mockReturnValue(undefined);
    render(<SkillDetailModal skillId={skill.id} categories={categories} onClose={vi.fn()} />);

    expect(await screen.findByText("meeting-note-cleaner.zip")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "复制下载链接" }));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(skill.fileUrl));
    expect(screen.getByText("已复制下载链接")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "下载 Skill 包" }));
    expect(api.downloadSkill).toHaveBeenCalledWith(skill.id);
    expect(screen.getByText("浏览器已打开下载链接")).toBeInTheDocument();
  });
});
