"use client";

import { useState } from "react";

const STAGE_OPTIONS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "trial", label: "Trial" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
] as const;

export default function LeadStageSelect({
  leadId,
  defaultStage,
}: {
  leadId: string;
  defaultStage: string;
}) {
  const [stage, setStage] = useState(defaultStage);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");

  const formId = `form-${leadId}`;
  const changed = stage !== defaultStage;

  return (
    <div className="flex flex-col gap-1">
      <select
        name="stage"
        form={formId}
        value={stage}
        onChange={(e) => {
          setStage(e.target.value);
          setShowNote(e.target.value !== defaultStage);
        }}
        className="bg-zinc-950 border border-zinc-800 rounded p-1 text-zinc-200 text-xs w-full max-w-[120px]"
      >
        {STAGE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {showNote && (
        <textarea
          name="stage_note"
          form={formId}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Quick note (optional)"
          rows={2}
          className="bg-zinc-950 border border-zinc-800 rounded p-1 text-zinc-200 text-[10px] w-full max-w-[160px] resize-none mt-1"
        />
      )}
      {changed && (
        <span className="text-[10px] text-yellow-500">
          Stage changed — click Save
        </span>
      )}
    </div>
  );
}
