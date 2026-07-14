import React from "react";
import type { IModule } from "@octo/base";
import { i18n, I18nProvider, WKApp, Menus, t as translate } from "@octo/base";
import McpMarketListPage from "./pages/McpMarketListPage";
import enUS from "./i18n/en-US.json";
import zhCN from "./i18n/zh-CN.json";
import "./index.css";

/**
 * NavRail 顶层菜单图标（MCP 市场）。与 dmworksummary / dmworktodo 的菜单图标同构：
 * 纯 SVG、随 active 变色，不引入额外依赖。图标语义：插件 / 拼装块（MCP = 可插拔工具）。
 */
function McpMarketIcon({ active }: { active?: boolean }) {
  const color = active ? "var(--wk-brand-primary, #7C5CFC)" : "currentColor";
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7h4V5a2 2 0 012-2h0a2 2 0 012 2v2h4a1 1 0 011 1v4h2a2 2 0 012 2v0a2 2 0 01-2 2h-2v3a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1z" />
    </svg>
  );
}

export class McpMarketModule implements IModule {
  id(): string {
    return "McpMarketModule";
  }

  init(): void {
    i18n.registerNamespace("mcp", {
      "zh-CN": zhCN,
      "en-US": enUS,
    });

    // Route for the MCP market main page (rendered full-width in the
    // content area, no secondary sidebar).
    WKApp.route.register("/mcp-market", () => {
      return <McpMarketListPage />;
    });

    // 顶层 NavRail 菜单入口。sort=5003 紧跟在 summary(4002/5000) 之后，
    // 与既有 chat(1000)/contacts(4000) 图标栏共用同一注册机制
    // (WKApp.menus.register)，不新造导航体系。菜单 id "mcp-market" 与
    // McpMarketListPage 监听的 wk:nav-menu-activated(menuId==="mcp-market")
    // 保持一致；routePath 指向 /mcp-market 列表页。
    WKApp.menus.register(
      "mcp-market",
      () => {
        return new Menus(
          "mcp-market",
          "/mcp-market",
          translate("mcp.menu.title"),
          <McpMarketIcon />,
          <McpMarketIcon active />
        );
      },
      5003
    );
  }
}

// HMR: endpoints are keyed by id, so re-registration on reload overwrites
// rather than duplicates; no extra teardown needed here (mirrors the shape of
// dmworksummary's dispose hook).
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    /* no-op: registrations are idempotent by id */
  });
}
