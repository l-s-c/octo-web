import React, { Component } from "react";
import { Spin, Toast } from "@douyinfe/semi-ui";
import { IconSearch, IconPlus } from "@douyinfe/semi-icons";
import { I18nContext, t, WKApp, WKInput, WKButton } from "@octo/base";
import { fetchMcpList } from "../api/mcpService";
import type { McpCategory, McpListItem } from "../types/mcp";
import McpCard from "../components/McpCard";
import McpDetailModal from "../components/McpDetailModal";
import McpCreateModal from "../components/McpCreateModal";
import "../index.css";

interface McpMarketListPageState {
  items: McpListItem[];
  categories: McpCategory[];
  loading: boolean;
  keyword: string;
  category: string;
  detailId: string | null;
  createVisible: boolean;
}

/**
 * Top-level MCP Market page. Rendered full-width in the main content area
 * (no secondary sidebar) when the "mcp-market" NavRail entry is active.
 */
export default class McpMarketListPage extends Component<
  {},
  McpMarketListPageState
> {
  static contextType = I18nContext;
  declare context: React.ContextType<typeof I18nContext>;

  state: McpMarketListPageState = {
    items: [],
    categories: [],
    loading: false,
    keyword: "",
    category: "all",
    detailId: null,
    createVisible: false,
  };

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  componentDidMount() {
    this.loadData();
    WKApp.mittBus.on("wk:nav-menu-activated", this.handleNavMenuActivated_);
    WKApp.mittBus.on("space-changed", this.handleSpaceChanged_);
  }

  componentWillUnmount() {
    WKApp.mittBus.off("wk:nav-menu-activated", this.handleNavMenuActivated_);
    WKApp.mittBus.off("space-changed", this.handleSpaceChanged_);
    if (this.searchTimer) clearTimeout(this.searchTimer);
  }

  private handleSpaceChanged_ = () => this.loadData();

  private handleNavMenuActivated_ = ({ menuId }: { menuId: string }) => {
    if (menuId === "mcp-market") {
      this.loadData();
    }
  };

  async loadData() {
    this.setState({ loading: true });
    try {
      const resp = await fetchMcpList({
        keyword: this.state.keyword,
        category: this.state.category,
      });
      this.setState({
        items: resp.items,
        categories: resp.categories,
        loading: false,
      });
    } catch (err: unknown) {
      this.setState({ loading: false });
      Toast.error(
        err instanceof Error ? err.message : t("mcp.common.loadFailed")
      );
    }
  }

  private handleKeyword = (value: string) => {
    this.setState({ keyword: value });
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.loadData(), 300);
  };

  private handleCategory = (key: string) => {
    this.setState({ category: key }, () => this.loadData());
  };

  render() {
    const {
      items,
      categories,
      loading,
      keyword,
      category,
      detailId,
      createVisible,
    } = this.state;

    return (
      <div className="wk-mcp">
        <div className="wk-mcp__topbar">
          <span className="wk-mcp__title">{t("mcp.menu.title")}</span>
          <WKButton
            variant="primary"
            icon={<IconPlus />}
            onClick={() => this.setState({ createVisible: true })}
          >
            {t("mcp.list.create")}
          </WKButton>
        </div>

        <div className="wk-mcp__body">
          <div className="wk-mcp__inner">
            <div className="wk-mcp__head">
              <h1 className="wk-mcp__head-title">{t("mcp.menu.title")}</h1>
              <p className="wk-mcp__head-desc">{t("mcp.list.desc")}</p>
            </div>

            <div className="wk-mcp__toolbar">
              <div className="wk-mcp__search">
                <WKInput
                  value={keyword}
                  onChange={this.handleKeyword}
                  prefix={<IconSearch />}
                  placeholder={t("mcp.list.searchPlaceholder")}
                />
              </div>
              <div className="wk-mcp__pills">
                {categories.map((cat) => (
                  <button
                    key={cat.key}
                    className={
                      cat.key === category
                        ? "wk-mcp__pill wk-mcp__pill--active"
                        : "wk-mcp__pill"
                    }
                    onClick={() => this.handleCategory(cat.key)}
                  >
                    {cat.label}
                    <span className="wk-mcp__pill-count">{cat.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="wk-mcp__state">
                <Spin />
              </div>
            ) : items.length === 0 ? (
              <div className="wk-mcp__state">{t("mcp.list.empty")}</div>
            ) : (
              <div className="wk-mcp__grid">
                {items.map((item) => (
                  <McpCard
                    key={item.id}
                    item={item}
                    onClick={(it) => this.setState({ detailId: it.id })}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <McpDetailModal
          mcpId={detailId}
          onClose={() => this.setState({ detailId: null })}
        />
        <McpCreateModal
          visible={createVisible}
          onClose={() => this.setState({ createVisible: false })}
          onCreated={() => this.loadData()}
        />
      </div>
    );
  }
}
