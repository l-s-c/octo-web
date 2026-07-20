import React, { useEffect, useState } from "react";

export function parseTagDraft(value: string): string[] {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
}

export default function TagMultiInput({ tags, placeholder, onCommit }: { tags: string[]; placeholder: string; onCommit: (tags: string[]) => void }) {
  const [draft, setDraft] = useState(tags.join(", "));
  useEffect(() => setDraft(tags.join(", ")), [tags.join("\u0000")]);
  const commit = () => { const next = parseTagDraft(draft); setDraft(next.join(", ")); onCommit(next); };
  return <input aria-label={placeholder} value={draft} placeholder={placeholder} onChange={(event) => setDraft(event.target.value)} onBlur={commit} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); commit(); } }} />;
}
