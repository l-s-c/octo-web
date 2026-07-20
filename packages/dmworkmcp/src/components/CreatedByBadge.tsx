import React from "react";
import { t } from "@octo/base";
import type { McpCreatedByType } from "../types/mcp";

interface CreatedByBadgeProps {
  type: McpCreatedByType;
  name: string;
  showLabel?: boolean;
}

const SOURCE_ICONS: Record<McpCreatedByType, string> = {
  human: "👤",
  bot: "🤖",
  import: "📥",
};

const CreatedByBadge: React.FC<CreatedByBadgeProps> = ({
  type,
  name,
  showLabel = false,
}) => (
  <span className={`wk-mcp-source wk-mcp-source--${type}`}>
    <span aria-hidden="true">{SOURCE_ICONS[type]}</span>
    {showLabel && <span>{t(`mcp.source.${type}`)}</span>}
    <span className="wk-mcp-source__name">{name}</span>
  </span>
);

export default CreatedByBadge;
