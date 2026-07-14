import React, { useState } from "react";
import { WKModal, WKInput, t } from "@octo/base";
import { Select, TextArea, Toast } from "@douyinfe/semi-ui";
import { createMcp } from "../api/mcpService";
import { MCP_CATEGORY_LABELS, MCP_CATEGORY_ORDER } from "../mock/mcpMock";
import type { CreateMcpParams, McpVisibility } from "../types/mcp";

interface McpCreateModalProps {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const EMPTY: CreateMcpParams = {
  name: "",
  provider: "",
  category: "dev",
  slogan: "",
  description: "",
  quickAccessConfig: "",
  visibility: "space",
};

/**
 * Create-MCP modal. Fields map 1:1 onto the detail modal's display fields.
 * Two-column compact layout so the form fits one screen without scrolling.
 */
const McpCreateModal: React.FC<McpCreateModalProps> = ({
  visible,
  onClose,
  onCreated,
}) => {
  const [form, setForm] = useState<CreateMcpParams>(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof CreateMcpParams>(
    key: K,
    value: CreateMcpParams[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      Toast.warning(t("mcp.create.nameRequired"));
      return;
    }
    setSubmitting(true);
    try {
      await createMcp(form);
      Toast.success(t("mcp.create.success"));
      setForm(EMPTY);
      onCreated();
      onClose();
    } catch (err: unknown) {
      Toast.error(err instanceof Error ? err.message : t("mcp.create.failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const categoryOptions = MCP_CATEGORY_ORDER.filter((k) => k !== "all").map(
    (k) => ({
      value: k,
      label: MCP_CATEGORY_LABELS[k],
    })
  );

  const visibilityOptions: { value: McpVisibility; label: string }[] = [
    { value: "public", label: t("mcp.create.visPublic") },
    { value: "space", label: t("mcp.create.visSpace") },
    { value: "private", label: t("mcp.create.visPrivate") },
  ];

  return (
    <WKModal
      visible={visible}
      onCancel={onClose}
      size="lg"
      title={t("mcp.create.title")}
      footerConfig={{
        okText: t("mcp.create.submit"),
        isOkLoading: submitting,
        onOk: handleSubmit,
      }}
    >
      <div className="wk-mcp-form">
        <div className="wk-mcp-form__field">
          <label className="wk-mcp-form__label wk-mcp-form__label-req">
            {t("mcp.create.name")}
          </label>
          <WKInput
            value={form.name}
            onChange={(v) => update("name", v)}
            placeholder={t("mcp.create.namePlaceholder")}
          />
        </div>

        <div className="wk-mcp-form__field">
          <label className="wk-mcp-form__label">
            {t("mcp.create.provider")}
          </label>
          <WKInput
            value={form.provider}
            onChange={(v) => update("provider", v)}
            placeholder={t("mcp.create.providerPlaceholder")}
          />
        </div>

        <div className="wk-mcp-form__field">
          <label className="wk-mcp-form__label">
            {t("mcp.create.category")}
          </label>
          <Select
            style={{ width: "100%" }}
            value={form.category}
            optionList={categoryOptions}
            onChange={(v) => update("category", v as string)}
          />
        </div>

        <div className="wk-mcp-form__field">
          <label className="wk-mcp-form__label">
            {t("mcp.create.visibility")}
          </label>
          <div className="wk-mcp-form__radios">
            {visibilityOptions.map((opt) => (
              <div
                key={opt.value}
                className={
                  form.visibility === opt.value
                    ? "wk-mcp-form__radio wk-mcp-form__radio--active"
                    : "wk-mcp-form__radio"
                }
                onClick={() => update("visibility", opt.value)}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>

        <div className="wk-mcp-form__field wk-mcp-form__field--full">
          <label className="wk-mcp-form__label">{t("mcp.create.slogan")}</label>
          <WKInput
            value={form.slogan}
            onChange={(v) => update("slogan", v)}
            placeholder={t("mcp.create.sloganPlaceholder")}
          />
        </div>

        <div className="wk-mcp-form__field wk-mcp-form__field--full">
          <label className="wk-mcp-form__label">
            {t("mcp.create.description")}
          </label>
          <TextArea
            value={form.description}
            onChange={(v) => update("description", v)}
            rows={2}
            placeholder={t("mcp.create.descriptionPlaceholder")}
          />
        </div>

        <div className="wk-mcp-form__field wk-mcp-form__field--full">
          <label className="wk-mcp-form__label">{t("mcp.create.config")}</label>
          <TextArea
            value={form.quickAccessConfig}
            onChange={(v) => update("quickAccessConfig", v)}
            rows={3}
            placeholder={t("mcp.create.configPlaceholder")}
          />
          <span className="wk-mcp-form__hint">
            {t("mcp.create.configHint")}
          </span>
        </div>
      </div>
    </WKModal>
  );
};

export default McpCreateModal;
