import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NewSkillModal from "../NewSkillModal";
import * as api from "../../api/skillApi";
import type { Category } from "../../types/skill";

const categories: Category[] = [
  { id: "all", name: "全部", iconKey: "LayoutGrid", sortOrder: 99, skillCount: 1 },
  { id: "office", name: "办公协作", iconKey: "FolderKanban", sortOrder: 1, skillCount: 1 },
  { id: "dev-tools", name: "开发工具", iconKey: "Code", sortOrder: 2, skillCount: 1 },
];

vi.mock("../../api/skillApi");

function zipFile(name = "skill-pack.zip", size = 1024 * 1024) {
  return new File(["x".repeat(Math.min(size, 1024))], name, { type: "application/zip" });
}

describe("NewSkillModal", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    vi.mocked(api.createSkill).mockResolvedValue({} as never);
  });

  it("validates zip files before upload starts", () => {
    render(<NewSkillModal visible categories={categories} onClose={vi.fn()} onCreated={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("选择 Skill zip 文件"), {
      target: { files: [new File(["readme"], "skill.txt", { type: "text/plain" })] },
    });

    expect(screen.getByText("文件格式不正确")).toBeInTheDocument();
    expect(screen.queryByText("上传进度")).not.toBeInTheDocument();
  });

  it("uploads, parses, prefills the form, and creates a skill", async () => {
    const onCreated = vi.fn();
    const onClose = vi.fn();
    render(<NewSkillModal visible categories={categories} onClose={onClose} onCreated={onCreated} />);

    fireEvent.change(screen.getByLabelText("选择 Skill zip 文件"), {
      target: { files: [zipFile()] },
    });

    expect(screen.getByText("上传进度")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(2000);
      await vi.runOnlyPendingTimersAsync();
    });

    expect(screen.getByText("解析中...")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1500);
      await vi.runOnlyPendingTimersAsync();
    });

    expect(screen.getByDisplayValue("skill-pack")).toBeInTheDocument();
    expect(screen.getByText("skill-pack.zip")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("分类"), { target: { value: "office" } });
    fireEvent.click(screen.getByRole("button", { name: "创建" }));

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await vi.runOnlyPendingTimersAsync();
      await Promise.resolve();
    });

    expect(api.createSkill).toHaveBeenCalledWith(expect.objectContaining({
      name: "skill-pack",
      categoryId: "office",
      fileName: "skill-pack.zip",
    }));
    expect(onCreated).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("disables create until required fields are filled", async () => {
    render(<NewSkillModal visible categories={categories} onClose={vi.fn()} onCreated={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("选择 Skill zip 文件"), {
      target: { files: [zipFile()] },
    });

    await act(async () => {
      vi.advanceTimersByTime(2000);
      await vi.runOnlyPendingTimersAsync();
    });

    await act(async () => {
      vi.advanceTimersByTime(1500);
      await vi.runOnlyPendingTimersAsync();
    });

    expect(screen.getByRole("button", { name: "创建" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("分类"), { target: { value: "office" } });

    expect(screen.getByRole("button", { name: "创建" })).not.toBeDisabled();
  });

  it("shows a leave confirmation while upload work is in progress", () => {
    const onClose = vi.fn();
    render(<NewSkillModal visible categories={categories} onClose={onClose} onCreated={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("选择 Skill zip 文件"), {
      target: { files: [zipFile()] },
    });
    fireEvent.click(screen.getByRole("button", { name: "取消" }));

    expect(screen.getByText("确定离开？Skill 包正在上传/解析中，离开后当前进度将丢失，需要重新上传。")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "继续上传" }));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "取消" }));
    fireEvent.click(screen.getByRole("button", { name: "确认离开" }));
    expect(onClose).toHaveBeenCalled();
  });
});
