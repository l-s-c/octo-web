import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileArchive, Loader2, UploadCloud, XCircle } from "lucide-react";
import { WKButton, WKInput, WKModal } from "@octo/base";
import type { Category, NewSkillForm, Visibility } from "../types/skill";
import { createSkill } from "../api/skillApi";
import { formatFileSize } from "../utils/format";

interface NewSkillModalProps {
  visible: boolean;
  categories: Category[];
  onClose: () => void;
  onCreated: () => void;
}

type UploadStage = "idle" | "uploading" | "parsing" | "form" | "error";

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
  return fileName.replace(/\.zip$/i, "").trim() || "new-skill";
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

export default function NewSkillModal({ visible, categories, onClose, onCreated }: NewSkillModalProps) {
  const selectableCategories = useMemo<Category[]>(
    () => categories.filter((category: Category) => category.id !== "all"),
    [categories],
  );
  const progressTimerRef = useRef<number | null>(null);
  const parseTimerRef = useRef<number | null>(null);
  const [stage, setStage] = useState<UploadStage>("idle");
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("space");
  const [version, setVersion] = useState("1.0.0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState<"busy" | "dirty" | null>(null);

  const busy = stage === "uploading" || stage === "parsing";
  const dirty = Boolean(file || name.trim() || description.trim() || tags.length || categoryId);

  useEffect(() => () => {
    if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
    if (parseTimerRef.current) window.clearTimeout(parseTimerRef.current);
  }, []);

  useEffect(() => {
    if (!visible) reset();
  }, [visible]);

  function reset() {
    if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
    if (parseTimerRef.current) window.clearTimeout(parseTimerRef.current);
    setStage("idle");
    setProgress(0);
    setFile(null);
    setName("");
    setDescription("");
    setCategoryId("");
    setTags([]);
    setTagDraft("");
    setVisibility("space");
    setVersion("1.0.0");
    setSaving(false);
    setError(null);
    setConfirmClose(null);
  }

  function requestClose() {
    if (busy) {
      setConfirmClose("busy");
      return;
    }
    if (dirty && !saving) {
      setConfirmClose("dirty");
      return;
    }
    onClose();
  }

  function confirmLeave() {
    reset();
    onClose();
  }

  function startUpload(nextFile: File) {
    const validationError = validateZipFile(nextFile);
    setError(validationError);
    if (validationError) {
      setStage("error");
      setFile(null);
      setProgress(0);
      return;
    }

    setFile(nextFile);
    setStage("uploading");
    setProgress(0);
    setError(null);

    if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
    progressTimerRef.current = window.setInterval(() => {
      setProgress((current) => {
        const next = Math.min(current + 10, 100);
        if (next >= 100) {
          if (progressTimerRef.current) window.clearInterval(progressTimerRef.current);
          setStage("parsing");
          parseTimerRef.current = window.setTimeout(() => finishParse(nextFile), 1500);
        }
        return next;
      });
    }, 200);
  }

  function finishParse(nextFile: File) {
    if (Math.random() < 0.8) {
      const parsed = mockParsedSkill(nextFile);
      setName(parsed.name);
      setDescription(parsed.description);
      setTags(parsed.tags);
      setVersion(parsed.version);
      setVisibility("space");
      setCategoryId("");
      setStage("form");
      setError(null);
      return;
    }
    setStage("error");
    setError(parseErrors[Math.floor(Math.random() * parseErrors.length)]);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0];
    if (nextFile) startUpload(nextFile);
    event.target.value = "";
  }

  function addTag() {
    const next = tagDraft.trim();
    if (!next || tags.includes(next)) return;
    setTags([...tags, next].slice(0, 5));
    setTagDraft("");
  }

  async function submit() {
    if (!name.trim() || !description.trim() || !categoryId) {
      setError("请填写名称、描述和分类");
      return;
    }
    if (!file) {
      setError("请先上传 Skill 压缩包");
      return;
    }
    const form: NewSkillForm = {
      name,
      description,
      categoryId,
      tags,
      visibility,
      version,
      readmeContent: createReadme(name, description, version),
      fileName: file.name,
      fileSize: file.size,
    };
    setSaving(true);
    setError(null);
    try {
      await createSkill(form);
      reset();
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <WKModal
        visible={visible}
        onCancel={requestClose}
        title="新建 Skill"
        size="lg"
        className="skill-market-workflow-modal"
        footer={stage === "form" ? (
          <>
            <WKButton variant="secondary" onClick={requestClose} disabled={saving}>取消</WKButton>
            <WKButton variant="primary" onClick={() => void submit()} loading={saving}>创建</WKButton>
          </>
        ) : (
          <WKButton variant="secondary" onClick={requestClose}>取消</WKButton>
        )}
      >
        <div className="skill-market-workflow">
          {error && (
            <div className="skill-market-form__error">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}
          {stage !== "form" ? (
            <section className="skill-market-upload-panel">
              <label
                className="skill-market-upload-dropzone"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const dropped = event.dataTransfer.files?.[0];
                  if (dropped) startUpload(dropped);
                }}
              >
                <input
                  aria-label="选择 Skill zip 文件"
                  type="file"
                  accept=".zip"
                  onChange={handleFileChange}
                />
                <UploadCloud size={28} />
                <strong>上传 Skill 压缩包（.zip，≤20MB）</strong>
                <span>zip 内需包含 SKILL.md 文件</span>
              </label>
              {stage === "uploading" && (
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
              {stage === "parsing" && (
                <div className="skill-market-upload-status is-parsing">
                  <Loader2 size={16} />
                  <span>解析中...</span>
                </div>
              )}
              {stage === "error" && (
                <WKButton variant="secondary" onClick={() => setStage("idle")}>重新选择文件</WKButton>
              )}
            </section>
          ) : (
            <section className="skill-market-form skill-market-form--workflow">
              <div className="skill-market-upload-file">
                <FileArchive size={18} />
                <div>
                  <strong>{file?.name}</strong>
                  <span>{file ? formatFileSize(file.size) : "-"} · 已解析 SKILL.md</span>
                </div>
                <button type="button" onClick={() => setStage("idle")}>重新上传</button>
              </div>
              <label>
                <span>名称</span>
                <WKInput value={name} onChange={setName} placeholder="skill-name" />
              </label>
              <label>
                <span>描述</span>
                <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="说明这个 Skill 解决什么问题" />
              </label>
              <div className="skill-market-form__row">
                <label>
                  <span>分类</span>
                  <select aria-label="分类" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                    <option value="">请选择分类</option>
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
            </section>
          )}
        </div>
      </WKModal>
      <ConfirmLeaveModal
        mode={confirmClose}
        onKeep={() => setConfirmClose(null)}
        onLeave={confirmLeave}
      />
    </>
  );
}

function ConfirmLeaveModal({
  mode,
  onKeep,
  onLeave,
}: {
  mode: "busy" | "dirty" | null;
  onKeep: () => void;
  onLeave: () => void;
}) {
  return (
    <WKModal
      visible={Boolean(mode)}
      onCancel={onKeep}
      title="确定离开？"
      size="md"
      footer={
        <>
          <WKButton variant="secondary" onClick={onKeep}>{mode === "busy" ? "继续上传" : "继续编辑"}</WKButton>
          <WKButton variant="danger" onClick={onLeave}>确认离开</WKButton>
        </>
      }
    >
      <p className="skill-market-confirm-text">
        {mode === "busy"
          ? "确定离开？Skill 包正在上传/解析中，离开后当前进度将丢失，需要重新上传。"
          : "确定离开？尚未完成创建，已上传的文件和填写的信息将丢失。"}
      </p>
    </WKModal>
  );
}
