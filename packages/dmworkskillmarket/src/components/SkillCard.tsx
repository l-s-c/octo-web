import React, { useLayoutEffect, useRef, useState } from "react";
import { Pencil, Terminal, Trash2 } from "lucide-react";
import { t, useI18n } from "@octo/base";
import type { Category, Skill } from "../types/skill";
import { getSkillAvatarColor, getSkillAvatarText } from "../utils/skillAvatar";

interface SkillCardProps {
  skill: Skill;
  categories: Category[];
  onOpen: (skill: Skill) => void;
  onEdit?: (skill: Skill) => void;
  onDelete?: (skill: Skill) => void;
  onInstall?: (skill: Skill) => void;
}

type DescriptionTooltipState = {
  visible: boolean;
  style: React.CSSProperties;
};

interface TooltipRect {
  left: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

interface TooltipBounds {
  pageLeft?: number;
  contentTop?: number;
  viewportWidth: number;
  viewportHeight: number;
}

export function getDescriptionTooltipStyle(
  descriptionRect: TooltipRect,
  tooltipRect: TooltipRect,
  bounds: TooltipBounds,
): React.CSSProperties {
  const viewportPadding = 12;
  const gap = 8;
  const boundaryLeft = Math.max(bounds.pageLeft ?? viewportPadding, viewportPadding);
  const boundaryRight = bounds.viewportWidth - viewportPadding;
  const boundaryTop = Math.max(bounds.contentTop ?? viewportPadding, viewportPadding);
  const boundaryBottom = bounds.viewportHeight - viewportPadding;
  const maxWidth = Math.max(180, Math.min(420, boundaryRight - boundaryLeft - viewportPadding));
  const availableAbove = Math.max(0, descriptionRect.top - boundaryTop - gap);
  const availableBelow = Math.max(0, boundaryBottom - descriptionRect.bottom - gap);
  const fitsAbove = tooltipRect.height <= availableAbove;
  const fitsBelow = tooltipRect.height <= availableBelow;
  const placeAbove = fitsAbove || (!fitsBelow && availableAbove > availableBelow);
  const availableHeight = placeAbove ? availableAbove : availableBelow;
  const maxHeight = Math.max(96, availableHeight);
  const renderedHeight = Math.min(tooltipRect.height, maxHeight);
  const left = Math.min(
    Math.max(descriptionRect.left, boundaryLeft + viewportPadding),
    Math.max(boundaryLeft + viewportPadding, boundaryRight - tooltipRect.width),
  );
  const preferredTop = placeAbove
    ? descriptionRect.top - renderedHeight - gap
    : descriptionRect.bottom + gap;
  const top = Math.min(
    Math.max(preferredTop, boundaryTop),
    Math.max(boundaryTop, boundaryBottom - renderedHeight),
  );

  return { left, top, maxWidth, maxHeight };
}

export default function SkillCard({ skill, categories: _categories, onOpen, onEdit, onDelete, onInstall }: SkillCardProps) {
  useI18n();
  void _categories;
  const [imgError, setImgError] = useState(false);
  const [descriptionTooltip, setDescriptionTooltip] = useState<DescriptionTooltipState>({
    visible: false,
    style: {},
  });
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const descriptionTooltipRef = useRef<HTMLDivElement>(null);
  const visibleTags = skill.tags.slice(0, 3);
  const hiddenTagCount = Math.max(0, skill.tags.length - visibleTags.length);
  const isOwnerCard = Boolean(onEdit || onDelete);
  const descriptionTooltipId = `skill-card-desc-${skill.id}`;
  const displayName = skill.displayName || skill.name;
  const ownerLabel = `@${skill.ownerName}`;

  useLayoutEffect(() => {
    const description = descriptionRef.current;
    const tooltip = descriptionTooltipRef.current;
    if (!descriptionTooltip.visible || !description || !tooltip) {
      return;
    }

    const descriptionRect = description.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const pageRect = description.closest(".skill-market-page")?.getBoundingClientRect();
    const contentRect = description.closest(".skill-market-content")?.getBoundingClientRect();
    setDescriptionTooltip({
      visible: true,
      style: getDescriptionTooltipStyle(descriptionRect, tooltipRect, {
        pageLeft: pageRect?.left,
        contentTop: contentRect?.top,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      }),
    });
  }, [descriptionTooltip.visible, skill.description]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.target instanceof HTMLElement && event.target.closest("button")) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen(skill);
    }
  }

  function handleDescriptionMouseEnter() {
    const description = descriptionRef.current;
    if (!description || skill.description.trim() === "") {
      setDescriptionTooltip({ visible: false, style: {} });
      return;
    }

    const truncated =
      description.scrollHeight > description.clientHeight ||
      description.scrollWidth > description.clientWidth;

    setDescriptionTooltip({
      visible: truncated,
      style: truncated ? { visibility: "hidden" } : {},
    });
  }

  return (
    <article
      className={isOwnerCard ? "skill-market-card skill-market-card--owner" : "skill-market-card"}
      role="button"
      tabIndex={0}
      aria-label={`${skill.name} @${skill.ownerName}`}
      onClick={() => onOpen(skill)}
      onKeyDown={handleKeyDown}
    >
      <div className="skill-market-card__top">
        <span className="skill-market-card__icon">
          {skill.iconUrl && !imgError ? (
            <img src={skill.iconUrl} alt="" onError={() => setImgError(true)} />
          ) : (
            <span
              className="skill-market-card__icon-default"
              style={{ background: getSkillAvatarColor(skill.name) }}
            >
              {getSkillAvatarText(skill.name)}
            </span>
          )}
        </span>
        <div className="skill-market-card__info">
          <h3 title={displayName}>{displayName}</h3>
          <div className="skill-market-card__tags">
            {visibleTags.map((tag) => (
              <span key={tag} title={tag}>{tag}</span>
            ))}
            {hiddenTagCount > 0 && <span>+{hiddenTagCount}</span>}
          </div>
        </div>
        <span className="skill-market-card__owner" title={ownerLabel}>{ownerLabel}</span>
        {(onEdit || onDelete) && (
          <div className="skill-market-card__actions" onClick={(event) => event.stopPropagation()}>
            {onEdit && (
              <button type="button" aria-label={t("skillMarket.card.editAriaLabel", { values: { name: skill.name } })} title={t("skillMarket.common.edit")} onClick={() => onEdit(skill)}>
                <Pencil size={15} />
              </button>
            )}
            {onDelete && (
              <button type="button" className="is-danger" aria-label={t("skillMarket.card.deleteAriaLabel", { values: { name: skill.name } })} title={t("skillMarket.common.delete")} onClick={() => onDelete(skill)}>
                <Trash2 size={15} />
              </button>
            )}
          </div>
        )}
      </div>
      <div className="skill-market-card__desc-wrap">
        <p
          ref={descriptionRef}
          className="skill-market-card__desc"
          aria-describedby={descriptionTooltip.visible ? descriptionTooltipId : undefined}
          onMouseEnter={handleDescriptionMouseEnter}
          onMouseLeave={() => setDescriptionTooltip({ visible: false, style: {} })}
        >
          {skill.description}
        </p>
        {descriptionTooltip.visible && (
          <div
            ref={descriptionTooltipRef}
            id={descriptionTooltipId}
            className="skill-market-card__desc-tooltip"
            role="tooltip"
            style={descriptionTooltip.style}
          >
            {skill.description}
          </div>
        )}
      </div>
      <div className="skill-market-card__footer" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="skill-market-card__install"
          onClick={() => onInstall?.(skill)}
        >
          <Terminal size={13} />
          {t("skillMarket.card.install")}
        </button>
      </div>
    </article>
  );
}
