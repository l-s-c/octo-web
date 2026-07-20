import React from "react";
import { t, WKButton } from "@octo/base";

interface McpListEmptyStateProps {
  activeFilterCount: number;
  onClearFilters: () => void;
  onCreate: () => void;
}

const McpListEmptyState: React.FC<McpListEmptyStateProps> = ({
  activeFilterCount,
  onClearFilters,
  onCreate,
}) => {
  const hasFilters = activeFilterCount > 0;

  return (
    <div className="wk-mcp__state wk-mcp__empty">
      <strong>{t(hasFilters ? "mcp.list.empty" : "mcp.list.noData")}</strong>
      {hasFilters ? (
        <>
          <span>
            {t("mcp.list.activeFilters", {
              values: { count: activeFilterCount },
            })}
          </span>
          <WKButton variant="secondary" onClick={onClearFilters}>
            {t("mcp.list.clearFilters")}
          </WKButton>
        </>
      ) : (
        <>
          <span>{t("mcp.list.noDataHint")}</span>
          <WKButton variant="primary" onClick={onCreate}>
            {t("mcp.list.create")}
          </WKButton>
        </>
      )}
    </div>
  );
};

export default McpListEmptyState;
