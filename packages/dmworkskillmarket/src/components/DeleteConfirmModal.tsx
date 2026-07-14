import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { WKButton, WKModal } from "@octo/base";
import type { Skill } from "../types/skill";
import { deleteSkill } from "../api/skillApi";

interface DeleteConfirmModalProps {
  skill: Skill | null;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteConfirmModal({ skill, onClose, onDeleted }: DeleteConfirmModalProps) {
  const [deleting, setDeleting] = useState(false);

  async function submit() {
    if (!skill) return;
    setDeleting(true);
    try {
      await deleteSkill(skill.id);
      onDeleted();
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <WKModal
      visible={Boolean(skill)}
      onCancel={onClose}
      title="删除 Skill"
      footer={
        <>
          <WKButton variant="secondary" onClick={onClose} disabled={deleting}>取消</WKButton>
          <WKButton variant="danger" onClick={() => void submit()} loading={deleting}>删除</WKButton>
        </>
      }
    >
      <div className="skill-market-delete">
        <AlertTriangle size={22} />
        <div>
          <strong>确定删除「{skill?.name}」？</strong>
          <p>删除后无法恢复</p>
        </div>
      </div>
    </WKModal>
  );
}
