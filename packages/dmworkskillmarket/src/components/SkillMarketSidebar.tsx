import React from "react";
import { Blocks } from "lucide-react";
import { t, useI18n, WKApp } from "@octo/base";
import SkillListPage from "../pages/SkillListPage";

export default function SkillMarketSidebar() {
  useI18n();
  return (
    <aside className="skill-market-sidebar">
      <div className="skill-market-sidebar__header">{t("skillMarket.sidebar.header")}</div>
      <nav className="skill-market-sidebar__nav" aria-label={t("skillMarket.sidebar.nav")}>
        <button
          type="button"
          className="is-active"
          onClick={() => WKApp.routeRight.replaceToRoot(<SkillListPage />)}
        >
          <Blocks size={16} />
          <span>Skills</span>
        </button>
      </nav>
    </aside>
  );
}

