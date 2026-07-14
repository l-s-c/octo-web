import React, { useMemo, useState } from "react";
import {
  Box,
  ChartColumn,
  ChevronDown,
  Cloud,
  Eye,
  Film,
  FolderKanban,
  Gamepad2,
  LayoutGrid,
  Megaphone,
  Monitor,
  MoreHorizontal,
  PenLine,
  Server,
  ShieldCheck,
  Smartphone,
  Terminal,
} from "lucide-react";
import type { Category } from "../types/skill";

interface CategoryChipsProps {
  categories: Category[];
  activeId: string;
  onChange: (categoryId: string) => void;
}

const DESKTOP_VISIBLE_LIMIT = 4;

const iconMap = {
  Box,
  ChartColumn,
  Cloud,
  Eye,
  Film,
  FolderKanban,
  Gamepad2,
  LayoutGrid,
  Megaphone,
  Monitor,
  MoreHorizontal,
  PenLine,
  Server,
  ShieldCheck,
  Smartphone,
  Terminal,
};

function CategoryIcon({ iconKey }: { iconKey: string }) {
  const Icon = iconMap[iconKey as keyof typeof iconMap] ?? Box;
  return <Icon size={14} aria-hidden="true" />;
}

export default function CategoryChips({ categories, activeId, onChange }: CategoryChipsProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const ordered = useMemo(() => {
    return [...categories].sort((a, b) => {
      if (a.id === "all") return -1;
      if (b.id === "all") return 1;
      if (a.skillCount > 0 && b.skillCount === 0) return -1;
      if (a.skillCount === 0 && b.skillCount > 0) return 1;
      return a.sortOrder - b.sortOrder;
    });
  }, [categories]);

  const activeCategory = ordered.find((category) => category.id === activeId);
  const desktopBase = ordered.slice(0, DESKTOP_VISIBLE_LIMIT);
  const desktopVisible = activeCategory && !desktopBase.some((category) => category.id === activeCategory.id)
    ? [...desktopBase, activeCategory]
    : desktopBase;
  const desktopVisibleIds = new Set(desktopVisible.map((category) => category.id));
  const overflow = ordered.filter((category) => !desktopVisibleIds.has(category.id));

  function choose(categoryId: string) {
    onChange(categoryId);
    setMoreOpen(false);
  }

  function renderChip(category: Category, className = "skill-market-category-chip") {
    return (
      <button
        key={category.id}
        type="button"
        className={
          category.id === activeId
            ? `${className} is-active`
            : className
        }
        aria-pressed={category.id === activeId}
        onClick={() => choose(category.id)}
        title={`${category.name} · ${category.skillCount} 个 Skill`}
      >
        <CategoryIcon iconKey={category.iconKey} />
        <span className="skill-market-category-label">{category.name}</span>
        <span className="skill-market-category-count">{category.skillCount}</span>
      </button>
    );
  }

  return (
    <div className="skill-market-category-strip" aria-label="Skill 分类">
      {desktopVisible.map((category) => renderChip(category))}
      {ordered.slice(0, 1).map((category) => renderChip(category, "skill-market-category-chip skill-market-category-chip--mobile-primary"))}
      {overflow.length > 0 && (
        <div className="skill-market-category-more">
        <button
          type="button"
          className="skill-market-category-chip skill-market-category-more__button"
          aria-expanded={moreOpen}
          aria-haspopup="menu"
          onClick={() => setMoreOpen((open) => !open)}
        >
          <MoreHorizontal size={14} aria-hidden="true" />
          <span className="skill-market-category-label">更多</span>
          <ChevronDown size={13} aria-hidden="true" />
        </button>
          {moreOpen && (
            <div className="skill-market-category-menu" role="menu">
              {overflow.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  role="menuitem"
                  className={category.id === activeId ? "is-active" : undefined}
                  onClick={() => choose(category.id)}
                >
                  <CategoryIcon iconKey={category.iconKey} />
                  <span>{category.name}</span>
                  <span>{category.skillCount}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
