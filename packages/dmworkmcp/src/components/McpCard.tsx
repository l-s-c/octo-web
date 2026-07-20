import React from "react";
import type { McpListItem } from "../types/mcp";
import { t } from "@octo/base";
import { IconGlyph } from "../utils/icon";

interface McpCardProps {
  item: McpListItem;
  onClick: (item: McpListItem) => void;
  keyword?: string;
}

function Highlight({ text, keyword = "" }: { text: string; keyword?: string }) {
  const index = text.toLowerCase().indexOf(keyword.trim().toLowerCase());
  if (!keyword.trim() || index < 0) return <>{text}</>;
  return <>{text.slice(0, index)}<mark>{text.slice(index, index + keyword.trim().length)}</mark>{text.slice(index + keyword.trim().length)}</>;
}

/** A single MCP server card in the list grid. */
const McpCard: React.FC<McpCardProps> = ({ item, onClick, keyword }) => {
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
          <IconGlyph icon={item.icon} className="wk-mcp-card__icon-img" alt={item.name} />
        </div>
        <div className="wk-mcp-card__heading">
          <div className="wk-mcp-card__name"><Highlight text={item.name} keyword={keyword} /></div>
          <div className="wk-mcp-card__tags">
            {item.tags.map((tag) => (
              <span key={tag} className="wk-mcp-tag wk-mcp-tag--accent">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="wk-mcp-card__slogan"><Highlight text={item.slogan} keyword={keyword} /></div>
      {item.matchReasons?.length ? (
        <div className="wk-mcp-card__reason">{item.matchReasons[0].replace("tool:", t("mcp.card.hitTool") + " ").replace("tag:", t("mcp.card.hitTag") + " ")}</div>
      ) : null}
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
