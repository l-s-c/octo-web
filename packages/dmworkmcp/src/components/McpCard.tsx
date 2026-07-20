import React from "react";
import type { McpListItem } from "../types/mcp";
import { t } from "@octo/base";
import { IconGlyph } from "../utils/icon";
import CreatedByBadge from "./CreatedByBadge";

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
        <div className="wk-mcp-card__icon">
          <IconGlyph
            icon={item.icon}
            className="wk-mcp-card__icon-img"
            alt={item.name}
          />
        </div>
        <div className="wk-mcp-card__heading">
          <div className="wk-mcp-card__title-row">
            <div className="wk-mcp-card__name">{item.name}</div>
            <CreatedByBadge
              type={item.createdByType ?? "human"}
              name={
                item.createdByName ??
                item.creatorName ??
                t("mcp.source.unknown")
              }
            />
          </div>
          <div className="wk-mcp-card__tags">
            {item.tags.map((tag) => (
              <span key={tag} className="wk-mcp-tag wk-mcp-tag--accent">
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
        <span className="wk-mcp-card__link">{t("mcp.card.viewDetail")} →</span>
      </div>
    </div>
  );
};

export default McpCard;
