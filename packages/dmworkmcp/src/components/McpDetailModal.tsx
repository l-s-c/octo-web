import React, { useEffect, useState } from "react";
import { WKModal, WKButton, t } from "@octo/base";
import { Toast, Spin } from "@douyinfe/semi-ui";
import { getMcpDetail } from "../api/mcpService";
import type { McpDetail } from "../types/mcp";

interface McpDetailModalProps {
  /** The id of the MCP to show; null closes the modal. */
  mcpId: string | null;
  onClose: () => void;
}

/**
 * Centered detail modal for an MCP server.
 * Section order (per product spec): 快速接入 → 工具清单 → 使用示例 → 常见问题 → 注意事项.
 */
const McpDetailModal: React.FC<McpDetailModalProps> = ({ mcpId, onClose }) => {
  const [detail, setDetail] = useState<McpDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!mcpId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getMcpDetail(mcpId)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          Toast.error(
            err instanceof Error ? err.message : t("mcp.common.loadFailed")
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mcpId]);

  const handleCopy = async () => {
    if (!detail) return;
    try {
      await navigator.clipboard.writeText(detail.quickAccessConfig);
      Toast.success(t("mcp.detail.copied"));
    } catch {
      Toast.error(t("mcp.detail.copyFailed"));
    }
  };

  return (
    <WKModal
      visible={!!mcpId}
      onCancel={onClose}
      size="lg"
      title={detail ? detail.name : t("mcp.detail.title")}
      footer={null}
    >
      {loading || !detail ? (
        <div className="wk-mcp__state">
          <Spin />
        </div>
      ) : (
        <div className="wk-mcp-detail">
          <div className="wk-mcp-detail__meta">
            <div className="wk-mcp-detail__icon">{detail.icon}</div>
            <div className="wk-mcp-detail__meta-main">
              <div className="wk-mcp-card__tags">
                {detail.tags.map((tag, i) => (
                  <span
                    key={tag}
                    className={
                      i === 0 ? "wk-mcp-tag wk-mcp-tag--accent" : "wk-mcp-tag"
                    }
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="wk-mcp-detail__provider">
                {detail.provider} ·{" "}
                {t("mcp.card.toolCount", {
                  values: { count: detail.toolCount },
                })}
              </div>
            </div>
          </div>

          <div className="wk-mcp-detail__desc">{detail.description}</div>

          {/* 1. 快速接入 */}
          <section className="wk-mcp-section">
            <h4 className="wk-mcp-section__title">
              {t("mcp.detail.quickAccess")}
            </h4>
            <div className="wk-mcp-code">
              <div className="wk-mcp-code__copy">
                <WKButton size="sm" variant="ghost" onClick={handleCopy}>
                  {t("mcp.detail.copy")}
                </WKButton>
              </div>
              <pre className="wk-mcp-code__pre">{detail.quickAccessConfig}</pre>
            </div>
          </section>

          {/* 2. 工具清单 */}
          <section className="wk-mcp-section">
            <h4 className="wk-mcp-section__title">{t("mcp.detail.tools")}</h4>
            <div className="wk-mcp-tools">
              {detail.tools.map((tool) => (
                <div className="wk-mcp-tool" key={tool.name}>
                  <div className="wk-mcp-tool__name">{tool.name}</div>
                  <div className="wk-mcp-tool__desc">{tool.description}</div>
                </div>
              ))}
            </div>
          </section>

          {/* 3. 使用示例 */}
          <section className="wk-mcp-section">
            <h4 className="wk-mcp-section__title">{t("mcp.detail.example")}</h4>
            <div className="wk-mcp-example">{detail.usageExample}</div>
          </section>

          {/* 4. 常见问题 */}
          <section className="wk-mcp-section">
            <h4 className="wk-mcp-section__title">{t("mcp.detail.faq")}</h4>
            <div className="wk-mcp-faq">
              {detail.faqs.map((faq) => (
                <div className="wk-mcp-faq__item" key={faq.question}>
                  <div className="wk-mcp-faq__q">{faq.question}</div>
                  <div className="wk-mcp-faq__a">{faq.answer}</div>
                </div>
              ))}
            </div>
          </section>

          {/* 5. 注意事项 */}
          <section className="wk-mcp-section">
            <h4 className="wk-mcp-section__title">{t("mcp.detail.notes")}</h4>
            <div className="wk-mcp-notes">
              {detail.notes.map((note, i) => (
                <div className="wk-mcp-notes__item" key={i}>
                  {note}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </WKModal>
  );
};

export default McpDetailModal;
