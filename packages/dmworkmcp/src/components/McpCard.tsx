import React from "react";
import type { McpListItem } from "../types/mcp";
import { t } from "@octo/base";

interface McpCardProps {
  item: McpListItem;
  onClick: (item: McpListItem) => void;
}

/** A single MCP server card in the list grid. */
const McpCard: React.FC<McpCardProps> = ({ item, onClick }) => {
  return (
    <div
      className="wk-mcp-card"
      role="button"
      tabIndex={0}
      onClick={() => onClick(item)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(item);
        }
      }}
    >
      <div className="wk-mcp-card__header">
        <div className="wk-mcp-card__icon">{item.icon}</div>
        <div className="wk-mcp-card__heading">
          <div className="wk-mcp-card__name">{item.name}</div>
          <div className="wk-mcp-card__tags">
            {item.tags.map((tag, i) => (
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
        </div>
      </div>
      <div className="wk-mcp-card__slogan">{item.slogan}</div>
      <div className="wk-mcp-card__footer">
        <span>
          {t("mcp.card.toolCount", { values: { count: item.toolCount } })}
        </span>
        <span className="wk-mcp-card__link">{t("mcp.card.viewDetail")}</span>
      </div>
    </div>
  );
};

export default McpCard;
