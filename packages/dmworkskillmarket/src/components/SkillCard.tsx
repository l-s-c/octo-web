import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { Category, Skill } from "../types/skill";

interface SkillCardProps {
  skill: Skill;
  categories: Category[];
  onOpen: (skill: Skill) => void;
  onEdit?: (skill: Skill) => void;
  onDelete?: (skill: Skill) => void;
}

export default function SkillCard({ skill, categories, onOpen, onEdit, onDelete }: SkillCardProps) {
  void categories;
  const visibleTags = skill.tags.slice(0, 3);
  const hiddenTagCount = Math.max(0, skill.tags.length - visibleTags.length);
  const isOwnerCard = Boolean(onEdit || onDelete);

  function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.target instanceof HTMLElement && event.target.closest("button")) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen(skill);
    }
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
      <div className="skill-market-card__header">
        <div className="skill-market-card__title-row">
          <h3>{skill.name}</h3>
          <span className="skill-market-card__owner">@{skill.ownerName}</span>
        </div>
        {(onEdit || onDelete) && (
          <div className="skill-market-card__actions" onClick={(event) => event.stopPropagation()}>
            {onEdit && (
              <button
                type="button"
                aria-label={`编辑 ${skill.name}`}
                title="编辑"
                onClick={() => onEdit(skill)}
              >
                <Pencil size={15} />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="is-danger"
                aria-label={`删除 ${skill.name}`}
                title="删除"
                onClick={() => onDelete(skill)}
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        )}
      </div>
      <div className="skill-market-card__tags">
        {visibleTags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
        {hiddenTagCount > 0 && <span>+{hiddenTagCount}</span>}
      </div>
      <p className="skill-market-card__desc">{skill.description}</p>
    </article>
  );
}
