import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EditSkillModal from "../EditSkillModal";
import * as api from "../../api/skillApi";
import type { Category, Skill } from "../../types/skill";

const categories: Category[] = [
  { id: "all", name: "全部", iconKey: "LayoutGrid", sortOrder: 99, skillCount: 1 },
  { id: "office", name: "办公协作", iconKey: "FolderKanban", sortOrder: 1, skillCount: 1 },
  { id: "dev-tools", name: "开发工具", iconKey: "Code", sortOrder: 2, skillCount: 1 },
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

describe("EditSkillModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.updateSkill).mockResolvedValue(skill);
  });

  it("prefills current skill fields and saves updates", async () => {
    const onUpdated = vi.fn();
    const onClose = vi.fn();
    render(<EditSkillModal skill={skill} categories={categories} onClose={onClose} onUpdated={onUpdated} />);

    expect(screen.getByDisplayValue("meeting-note-cleaner")).toBeInTheDocument();
    expect(screen.getByDisplayValue(skill.description)).toBeInTheDocument();
    expect(screen.getByText("meeting-note-cleaner.zip")).toBeInTheDocument();
    expect(screen.getByText("重新上传 zip 包")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("描述"), { target: { value: "更新后的说明" } });
    fireEvent.change(screen.getByLabelText("分类"), { target: { value: "dev-tools" } });
    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    await waitFor(() => expect(api.updateSkill).toHaveBeenCalledWith("meeting-note-cleaner", expect.objectContaining({
      description: "更新后的说明",
      categoryId: "dev-tools",
      name: "meeting-note-cleaner",
    })));
    expect(onUpdated).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("guards closing after the form is changed", () => {
    const onClose = vi.fn();
    render(<EditSkillModal skill={skill} categories={categories} onClose={onClose} onUpdated={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("描述"), { target: { value: "更新后的说明" } });
    fireEvent.click(screen.getByRole("button", { name: "取消" }));

    expect(screen.getByText("确定离开？尚未完成创建，已上传的文件和填写的信息将丢失。")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "继续编辑" }));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "取消" }));
    fireEvent.click(screen.getByRole("button", { name: "确认离开" }));
    expect(onClose).toHaveBeenCalled();
  });
});
