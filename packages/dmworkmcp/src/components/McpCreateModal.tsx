import React, { useState } from "react";
import { WKModal, WKInput, WKButton, t } from "@octo/base";
import { Select, TextArea, Toast } from "@douyinfe/semi-ui";
import { createMcp, probeMcpTools } from "../api/mcpService";
import { MCP_CATEGORY_LABELS, MCP_CATEGORY_ORDER } from "../mock/mcpMock";
import type {
  CreateMcpParams,
  McpProbeRequest,
  McpTransport,
  McpVisibility,
} from "../types/mcp";

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
  transport: "stdio",
  url: "",
  command: "",
  tools: [],
  visibility: "space",
};

const TRANSPORT_OPTIONS: McpTransport[] = ["stdio", "streamable-http", "sse"];

/** Whether the chosen transport is a remote (network) one. */
function isRemote(transport: McpTransport): boolean {
  return transport === "streamable-http" || transport === "sse";
}

/**
 * Create-MCP modal. Fields map 1:1 onto the detail modal's display fields.
 * Two-column compact layout so the form fits one screen without scrolling.
 *
 * The 「试连/获取工具列表」button calls `probeMcpTools` (mock this round) and
 * backfills the tool list from the result. TODO: 后端提供真实探测接口.
 */
const McpCreateModal: React.FC<McpCreateModalProps> = ({
  visible,
  onClose,
  onCreated,
}) => {
  const [form, setForm] = useState<CreateMcpParams>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [probing, setProbing] = useState(false);

  const update = <K extends keyof CreateMcpParams>(
    key: K,
    value: CreateMcpParams[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleProbe = async () => {
    // Build the probe request from the current connection config. Real probing
    // (esp. stdio) will run in the Electron main process — see LSC-70.
    // TODO: 后端提供真实探测接口
    const req: McpProbeRequest = isRemote(form.transport)
      ? { transport: form.transport, url: form.url }
      : { transport: form.transport, command: form.command };
    setProbing(true);
    try {
      const result = await probeMcpTools(req);
      if (!result.ok) {
        const code = result.error?.code;
        Toast.error(
          code
            ? t(`mcp.create.probeError.${code}`)
            : t("mcp.create.probeFailed")
        );
        return;
      }
      update("tools", result.tools);
      Toast.success(
        t("mcp.create.probeSuccess", {
          values: { count: result.tools.length },
        })
      );
    } catch (err: unknown) {
      Toast.error(
        err instanceof Error ? err.message : t("mcp.create.probeFailed")
      );
    } finally {
      setProbing(false);
    }
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

  const transportOptions = TRANSPORT_OPTIONS.map((tr) => ({
    value: tr,
    label: t(`mcp.create.transport.${tr}`),
  }));

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
            {t("mcp.create.transportLabel")}
          </label>
          <Select
            style={{ width: "100%" }}
            value={form.transport}
            optionList={transportOptions}
            onChange={(v) => update("transport", v as McpTransport)}
          />
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
          <label className="wk-mcp-form__label">
            {isRemote(form.transport)
              ? t("mcp.create.url")
              : t("mcp.create.command")}
          </label>
          {isRemote(form.transport) ? (
            <WKInput
              value={form.url ?? ""}
              onChange={(v) => update("url", v)}
              placeholder={t("mcp.create.urlPlaceholder")}
            />
          ) : (
            <WKInput
              value={form.command ?? ""}
              onChange={(v) => update("command", v)}
              placeholder={t("mcp.create.commandPlaceholder")}
            />
          )}
        </div>

        <div className="wk-mcp-form__field wk-mcp-form__field--full">
          <div className="wk-mcp-form__tools-head">
            <label className="wk-mcp-form__label">
              {t("mcp.create.tools")}
            </label>
            <WKButton
              size="sm"
              variant="secondary"
              loading={probing}
              onClick={handleProbe}
            >
              {t("mcp.create.probe")}
            </WKButton>
          </div>
          {form.tools.length === 0 ? (
            <div className="wk-mcp-form__tools-empty">
              {t("mcp.create.toolsEmpty")}
            </div>
          ) : (
            <div className="wk-mcp-form__tools">
              {form.tools.map((tool) => (
                <div className="wk-mcp-form__tool" key={tool.name}>
                  <span className="wk-mcp-form__tool-name">{tool.name}</span>
                  <span className="wk-mcp-form__tool-desc">
                    {tool.description}
                  </span>
                </div>
              ))}
            </div>
          )}
          <span className="wk-mcp-form__hint">{t("mcp.create.toolsHint")}</span>
        </div>

        <div className="wk-mcp-form__field wk-mcp-form__field--full">
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
      </div>
    </WKModal>
  );
};

export default McpCreateModal;
