import React from "react";
import { t } from "@octo/base";
import type { McpCreatedByType } from "../types/mcp";

interface CreatedByBadgeProps {
  type: McpCreatedByType;
  name: string;
  showLabel?: boolean;
}

const SOURCE_ICONS: Record<Exclude<McpCreatedByType, "human">, string> = {
  bot: "🤖",
  import: "📥",
};

export function getCreatorInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

const CreatedByBadge: React.FC<CreatedByBadgeProps> = ({
  type,
  name,
  showLabel = false,
}) => (
  <span
    className={`wk-mcp-source wk-mcp-source--${type}`}
    aria-label={`${t(`mcp.source.${type}`)}：${name}`}
  >
    {type === "human" ? (
      <span className="wk-mcp-source__avatar" aria-hidden="true">
        {getCreatorInitial(name)}
      </span>
    ) : (
      <span aria-hidden="true">{SOURCE_ICONS[type]}</span>
    )}
    {showLabel && <span>{t(`mcp.source.${type}`)}</span>}
    <span className="wk-mcp-source__name" aria-hidden="true">
      {name}
    </span>
  </span>
);

export default CreatedByBadge;
