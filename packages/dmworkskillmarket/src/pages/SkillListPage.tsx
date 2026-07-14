import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, PackageOpen, Plus, RefreshCw } from "lucide-react";
import { WKButton } from "@octo/base";
import type { Skill } from "../types/skill";
import { useSkills } from "../hooks/useSkills";
import CategoryChips from "../components/CategoryChips";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import EditSkillModal from "../components/EditSkillModal";
import NewSkillModal from "../components/NewSkillModal";
import SearchBar from "../components/SearchBar";
import SkillCard from "../components/SkillCard";
import SkillDetailModal from "../components/SkillDetailModal";

interface SkillListPageProps {
  mine?: boolean;
}

export default function SkillListPage({ mine = false }: SkillListPageProps) {
  const list = useSkills({ mine });
  const [createVisible, setCreateVisible] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Skill | null>(null);
  const [deleting, setDeleting] = useState<Skill | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        list.loadMore();
      }
    }, { rootMargin: "160px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [list]);

  const title = mine ? "我创建" : "Skills";
  const desc = mine
    ? "管理当前用户创建的 Skill，支持编辑、删除和查看详情。"
    : "浏览团队 Skill 市场，按分类和关键词快速找到可复用能力。";

  function handleDeleted() {
    setToast("已删除");
    list.refresh();
  }

  return (
    <div className="skill-market-page">
      <header className="skill-market-topbar">
        <div>
          <h1>{title}</h1>
          <p>{desc}</p>
        </div>
        <div className="skill-market-topbar__actions">
          <WKButton variant="secondary" icon={<RefreshCw size={15} />} onClick={list.refresh}>
            刷新
          </WKButton>
          <WKButton variant="primary" icon={<Plus size={15} />} onClick={() => setCreateVisible(true)}>
            新建 Skill
          </WKButton>
        </div>
      </header>

      <section className={mine ? "skill-market-toolbar skill-market-toolbar--mine" : "skill-market-toolbar"}>
        <SearchBar
          value={list.query}
          onChange={list.setQuery}
          placeholder="搜索"
        />
        {!mine && (
          <CategoryChips
            categories={list.categories}
            activeId={list.categoryId}
            onChange={list.setCategoryId}
          />
        )}
      </section>

      <main className="skill-market-content">
        {toast && (
          <div className="skill-market-toast" role="status">
            {toast}
            <button type="button" onClick={() => setToast(null)} aria-label="关闭提示">×</button>
          </div>
        )}
        {list.loading && (
          <div className="skill-market-grid" aria-label="Skill 加载中">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="skill-market-card-skeleton" />
            ))}
          </div>
        )}
        {list.error && (
          <div className="skill-market-state is-error">
            <AlertCircle size={28} />
            <strong>加载失败</strong>
            <span>{list.error}</span>
            <WKButton variant="secondary" icon={<RefreshCw size={15} />} onClick={list.refresh}>
              重试
            </WKButton>
          </div>
        )}
        {!list.loading && !list.error && list.skills.length === 0 && (
          <div className="skill-market-state">
            <PackageOpen size={32} />
            <strong>没有找到匹配的 Skill</strong>
            <span>换个关键词或分类后再试</span>
          </div>
        )}
        {!list.loading && !list.error && list.skills.length > 0 && (
          <div className="skill-market-grid">
            {list.skills.map((skill) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                categories={list.categories}
                onOpen={(item) => setDetailId(item.id)}
                onEdit={mine ? setEditing : undefined}
                onDelete={mine ? setDeleting : undefined}
              />
            ))}
          </div>
        )}
        <div ref={sentinelRef} className="skill-market-sentinel">
          {list.loadingMore ? "继续加载..." : list.hasMore ? "滚动加载更多" : "已加载全部"}
        </div>
      </main>

      <SkillDetailModal
        skillId={detailId}
        categories={list.categories}
        onClose={() => setDetailId(null)}
        onEdit={mine ? setEditing : undefined}
        onDelete={mine ? setDeleting : undefined}
      />
      <NewSkillModal
        visible={createVisible}
        categories={list.categories}
        onClose={() => setCreateVisible(false)}
        onCreated={list.refresh}
      />
      <EditSkillModal
        skill={editing}
        categories={list.categories}
        onClose={() => setEditing(null)}
        onUpdated={list.refresh}
      />
      <DeleteConfirmModal
        skill={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
