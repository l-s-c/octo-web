import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileArchive, Loader2, XCircle } from "lucide-react";
import { WKButton, WKInput, WKModal } from "@octo/base";
import type { Category, Skill, Visibility } from "../types/skill";
import { updateSkill } from "../api/skillApi";
import { formatFileSize } from "../utils/format";

interface EditSkillModalProps {
  skill: Skill | null;
  categories: Category[];
  onClose: () => void;
  onUpdated: (skill: Skill) => void;
}

type UploadStage = "idle" | "uploading" | "parsing" | "error";

interface ParsedSkill {
  name: string;
  description: string;
  tags: string[];
  version: string;
}

const MAX_ZIP_SIZE = 20 * 1024 * 1024;
const parseErrors = ["zip 包中未找到 SKILL.md", "文件格式不正确", "压缩包已损坏"];

function createReadme(name: string, description: string, version: string): string {
  return `# ${name}\n\n${description}\n\n## Version\n\n${version}\n`;
}

function parseFileName(fileName: string): string {
  return fileName.replace(/\.zip$/i, "").trim() || "updated-skill";
}

function mockParsedSkill(file: File): ParsedSkill {
  const baseName = parseFileName(file.name);
  return {
    name: baseName,
    description: `${baseName} 提供可复用的自动化工作流，支持快速接入团队协作场景。`,
    tags: ["自动化", "Skill", "协作"],
    version: `1.${Math.floor(Math.random() * 5)}.0`,
  };
}

function validateZipFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith(".zip")) return "文件格式不正确";
  if (file.size > MAX_ZIP_SIZE) return "文件超过 20MB";
  return null;
}

export default function EditSkillModal({ skill, categories, onClose, onUpdated }: EditSkillModalProps) {
  const selectableCategories = useMemo<Category[]>(
    () => categories.filter((category: Category) => category.id !== "all"),
    [categories],
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const parseTimerRef = useRef<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("dev-tools");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("space");
  const [version, setVersion] = useState("1.0.0");
  const [uploadStage, setUploadStage] = useState<UploadStage>("idle");
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);

  function clearUploadTimers() {
    if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
    if (parseTimerRef.current) window.clearTimeout(parseTimerRef.current);
    progressTimerRef.current = null;
    parseTimerRef.current = null;
  }

  useEffect(() => () => {
    clearUploadTimers();
  }, []);

  useEffect(() => {
    if (!skill) {
      clearUploadTimers();
      return;
    }
    clearUploadTimers();
    setName(skill.name);
    setDescription(skill.description);
    setCategoryId(skill.categoryId);
    setTags(skill.tags);
    setTagDraft("");
    setVisibility(skill.visibility);
    setVersion(skill.version);
    setUploadStage("idle");
    setProgress(0);
    setUploadedFile(null);
    setError(null);
    setConfirmClose(false);
  }, [skill]);

  const busy = uploadStage === "uploading" || uploadStage === "parsing";
  const dirty = Boolean(skill) && (
    name !== skill?.name ||
    description !== skill?.description ||
    categoryId !== skill?.categoryId ||
    visibility !== skill?.visibility ||
    tags.join("\u0000") !== skill?.tags.join("\u0000") ||
    Boolean(uploadedFile)
  );

  function requestClose() {
    if (busy) {
      setConfirmClose(true);
      return;
    }
    if (dirty && !saving) {
      setConfirmClose(true);
      return;
    }
    onClose();
  }

  function confirmLeave() {
    clearUploadTimers();
    setUploadStage("idle");
    setProgress(0);
    setUploadedFile(null);
    onClose();
  }

  function addTag() {
    const next = tagDraft.trim();
    if (!next || tags.includes(next)) return;
    setTags([...tags, next].slice(0, 5));
    setTagDraft("");
  }

  function startUpload(file: File) {
    clearUploadTimers();
    const validationError = validateZipFile(file);
    setError(validationError);
    if (validationError) {
      setUploadStage("error");
      setUploadedFile(null);
      setProgress(0);
      return;
    }

    setUploadedFile(file);
    setUploadStage("uploading");
    setProgress(0);
    setError(null);

    if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
    progressTimerRef.current = window.setInterval(() => {
      setProgress((current) => {
        const next = Math.min(current + 10, 100);
        if (next >= 100) {
          if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
          progressTimerRef.current = null;
          setUploadStage("parsing");
          parseTimerRef.current = window.setTimeout(() => finishParse(file), 1500);
        }
        return next;
      });
    }, 200);
  }

  function finishParse(file: File) {
    if (Math.random() < 0.8) {
      const parsed = mockParsedSkill(file);
      setName(parsed.name);
      setDescription(parsed.description);
      setTags(parsed.tags);
      setVersion(parsed.version);
      setUploadStage("idle");
      setError(null);
      return;
    }
    setUploadStage("error");
    setUploadedFile(null);
    setError(parseErrors[Math.floor(Math.random() * parseErrors.length)]);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) startUpload(file);
    event.target.value = "";
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
      const updated = await updateSkill(skill.id, {
        name,
        description,
        categoryId,
        tags,
        visibility,
        version,
        readmeContent: uploadedFile ? createReadme(name, description, version) : skill.readmeContent.replace(skill.name, name),
        ...(uploadedFile ? { fileName: uploadedFile.name, fileSize: uploadedFile.size } : {}),
      });
      onUpdated(updated);
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
            <WKButton
              variant="primary"
              onClick={() => void submit()}
              loading={saving}
              disabled={busy || uploadStage === "error" || !name.trim() || !description.trim()}
            >
              保存
            </WKButton>
          </>
        }
      >
        <div className="skill-market-form skill-market-form--workflow">
          {error && (
            <div className="skill-market-form__error">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}
          <div className="skill-market-upload-file">
            <FileArchive size={18} />
            <div>
              <strong>{uploadedFile?.name ?? skill?.fileName}</strong>
              <span>
                {uploadedFile ? formatFileSize(uploadedFile.size) : skill ? formatFileSize(skill.fileSize) : "-"}
                {uploadedFile ? " · 已解析 SKILL.md" : " · 当前 Skill 包"}
              </span>
            </div>
            <button type="button" onClick={() => fileInputRef.current?.click()}>重新上传 zip 包</button>
            <input
              ref={fileInputRef}
              aria-label="选择新的 Skill zip 文件"
              className="skill-market-upload-file__input"
              type="file"
              accept=".zip"
              onChange={handleFileChange}
            />
          </div>
          {uploadStage === "uploading" && (
            <div className="skill-market-upload-status">
              <div className="skill-market-upload-status__line">
                <span>上传进度</span>
                <strong>{progress}%</strong>
              </div>
              <div className="skill-market-progress" aria-label="上传进度条">
                <span style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
          {uploadStage === "parsing" && (
            <div className="skill-market-upload-status is-parsing">
              <Loader2 size={16} />
              <span>解析中...</span>
            </div>
          )}
          {uploadStage === "error" && (
            <WKButton variant="secondary" onClick={() => fileInputRef.current?.click()}>重新选择文件</WKButton>
          )}
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
            <WKButton variant="danger" onClick={confirmLeave}>确认离开</WKButton>
          </>
        }
      >
        <p className="skill-market-confirm-text">
          {busy
            ? "确定离开？Skill 包正在上传/解析中，离开后当前进度将丢失，需要重新上传。"
            : "确定离开？尚未完成编辑，已上传的文件和填写的信息将丢失。"}
        </p>
      </WKModal>
    </>
  );
}
