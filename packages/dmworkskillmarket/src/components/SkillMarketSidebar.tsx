import React, { useEffect, useState } from "react";
import { Blocks, UserRound } from "lucide-react";
import { WKApp } from "@octo/base";
import SkillListPage from "../pages/SkillListPage";
import MyCreatedPage from "../pages/MyCreatedPage";

const items = [
  {
    id: "skills",
    label: "Skills",
    icon: <Blocks size={16} />,
    render: () => <SkillListPage />,
  },
  {
    id: "mine",
    label: "我创建",
    icon: <UserRound size={16} />,
    render: () => <MyCreatedPage />,
  },
];

type SkillMarketTab = "skills" | "mine";

function tabFromHash(): SkillMarketTab {
  return window.location.hash === "#mine" ? "mine" : "skills";
}

export default function SkillMarketSidebar() {
  const [activeId, setActiveId] = useState<SkillMarketTab>(() => tabFromHash());

  useEffect(() => {
    const activeItem = items.find((item) => item.id === activeId) ?? items[0];
    WKApp.routeRight.replaceToRoot(activeItem.render());
  }, []);

  useEffect(() => {
    function syncFromHash() {
      setActiveId(tabFromHash());
    }
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  return (
    <aside className="skill-market-sidebar">
      <div className="skill-market-sidebar__header">Skill 市场</div>
      <nav className="skill-market-sidebar__nav" aria-label="Skill 市场导航">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === activeId ? "is-active" : ""}
            onClick={() => {
              setActiveId(item.id as SkillMarketTab);
              window.location.hash = item.id === "mine" ? "mine" : "skills";
              WKApp.routeRight.replaceToRoot(item.render());
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
