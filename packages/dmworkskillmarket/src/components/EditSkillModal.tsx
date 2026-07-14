import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileArchive, XCircle } from "lucide-react";
import { WKButton, WKInput, WKModal } from "@octo/base";
import type { Category, Skill, Visibility } from "../types/skill";
import { updateSkill } from "../api/skillApi";
import { formatFileSize } from "../utils/format";

interface EditSkillModalProps {
  skill: Skill | null;
  categories: Category[];
  onClose: () => void;
  onUpdated: () => void;
}

export default function EditSkillModal({ skill, categories, onClose, onUpdated }: EditSkillModalProps) {
  const selectableCategories = useMemo<Category[]>(
    () => categories.filter((category: Category) => category.id !== "all"),
    [categories],
  );
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("dev-tools");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("space");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);

  useEffect(() => {
    if (!skill) return;
    setName(skill.name);
    setDescription(skill.description);
    setCategoryId(skill.categoryId);
    setTags(skill.tags);
    setTagDraft("");
    setVisibility(skill.visibility);
    setError(null);
    setConfirmClose(false);
  }, [skill]);

  const dirty = Boolean(skill) && (
    name !== skill?.name ||
    description !== skill?.description ||
    categoryId !== skill?.categoryId ||
    visibility !== skill?.visibility ||
    tags.join("\u0000") !== skill?.tags.join("\u0000")
  );

  function requestClose() {
    if (dirty && !saving) {
      setConfirmClose(true);
      return;
    }
    onClose();
  }

  function addTag() {
    const next = tagDraft.trim();
    if (!next || tags.includes(next)) return;
    setTags([...tags, next].slice(0, 5));
    setTagDraft("");
  }

  async function submit() {
    if (!skill) return;
    if (!name.trim() || !description.trim() || !categoryId) {
      setError("请填写名称、描述和分类");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateSkill(skill.id, {
        name,
        description,
        categoryId,
        tags,
        visibility,
        readmeContent: skill.readmeContent.replace(skill.name, name),
      });
      onUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <WKModal
        visible={Boolean(skill)}
        onCancel={requestClose}
        title={skill ? `编辑 ${skill.name}` : "编辑 Skill"}
        size="lg"
        className="skill-market-workflow-modal"
        footer={
          <>
            <WKButton variant="secondary" onClick={requestClose} disabled={saving}>取消</WKButton>
            <WKButton variant="primary" onClick={() => void submit()} loading={saving}>保存</WKButton>
          </>
        }
      >
        <div className="skill-market-form skill-market-form--workflow">
          {error && <div className="skill-market-form__error">{error}</div>}
          <div className="skill-market-upload-file">
            <FileArchive size={18} />
            <div>
              <strong>{skill?.fileName}</strong>
              <span>{skill ? formatFileSize(skill.fileSize) : "-"} · 当前 Skill 包</span>
            </div>
            <button type="button">重新上传 zip 包</button>
          </div>
          <label>
            <span>名称</span>
            <WKInput value={name} onChange={setName} placeholder="skill-name" />
          </label>
          <label>
            <span>描述</span>
            <textarea aria-label="描述" value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>
          <div className="skill-market-form__row">
            <label>
              <span>分类</span>
              <select aria-label="分类" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                {selectableCategories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
            <fieldset className="skill-market-radio-group">
              <legend>可见性</legend>
              {[
                ["public", "公开"],
                ["space", "Space 内"],
                ["private", "私有"],
              ].map(([value, label]) => (
                <label key={value}>
                  <input
                    type="radio"
                    checked={visibility === value}
                    onChange={() => setVisibility(value as Visibility)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </fieldset>
          </div>
          <label>
            <span>标签</span>
            <div className="skill-market-tag-input">
              {tags.map((tag) => (
                <button key={tag} type="button" onClick={() => setTags(tags.filter((item) => item !== tag))}>
                  {tag}
                  <XCircle size={12} />
                </button>
              ))}
              <input
                value={tagDraft}
                onChange={(event) => setTagDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addTag();
                  }
                }}
                onBlur={addTag}
                placeholder="输入标签后回车"
              />
            </div>
          </label>
          <div className="skill-market-doc-note">
            <CheckCircle2 size={15} />
            <span>由 SKILL.md 自动解析，如需修改请重新上传 zip 包</span>
          </div>
        </div>
      </WKModal>
      <WKModal
        visible={confirmClose}
        onCancel={() => setConfirmClose(false)}
        title="确定离开？"
        size="md"
        footer={
          <>
            <WKButton variant="secondary" onClick={() => setConfirmClose(false)}>继续编辑</WKButton>
            <WKButton variant="danger" onClick={onClose}>确认离开</WKButton>
          </>
        }
      >
        <p className="skill-market-confirm-text">确定离开？尚未完成创建，已上传的文件和填写的信息将丢失。</p>
      </WKModal>
    </>
  );
}
