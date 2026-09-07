"use client";

import { useActionState } from "react";
import {
  updateMemberProfile,
  type UpdateProfileResult,
} from "./actions";

type Initial = {
  phone: string;
  primary_goal: string;
  secondary_goal: string;
  diet_preference: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
};

const fieldStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "var(--radius-sm)",
  padding: "0.55rem 0.75rem",
  color: "#fff",
  fontSize: "0.875rem",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.6875rem",
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--color-silver-dark)",
  marginBottom: "0.35rem",
};

export function ProfileEditForm({ initial }: { initial: Initial }) {
  const [state, formAction, pending] = useActionState<
    UpdateProfileResult | null,
    FormData
  >(updateMemberProfile, null);

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
      <div>
        <label htmlFor="phone" style={labelStyle}>
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={initial.phone}
          autoComplete="tel"
          style={fieldStyle}
        />
      </div>

      <div>
        <label htmlFor="primary_goal" style={labelStyle}>
          Primary goal
        </label>
        <input
          id="primary_goal"
          name="primary_goal"
          type="text"
          defaultValue={initial.primary_goal}
          maxLength={200}
          style={fieldStyle}
        />
      </div>

      <div>
        <label htmlFor="secondary_goal" style={labelStyle}>
          Secondary goal
        </label>
        <input
          id="secondary_goal"
          name="secondary_goal"
          type="text"
          defaultValue={initial.secondary_goal}
          maxLength={200}
          style={fieldStyle}
        />
      </div>

      <div>
        <label htmlFor="diet_preference" style={labelStyle}>
          Diet preference
        </label>
        <input
          id="diet_preference"
          name="diet_preference"
          type="text"
          defaultValue={initial.diet_preference}
          placeholder="e.g. vegetarian, high-protein"
          style={fieldStyle}
        />
      </div>

      <div>
        <label htmlFor="emergency_contact_name" style={labelStyle}>
          Emergency contact name
        </label>
        <input
          id="emergency_contact_name"
          name="emergency_contact_name"
          type="text"
          defaultValue={initial.emergency_contact_name}
          style={fieldStyle}
        />
      </div>

      <div>
        <label htmlFor="emergency_contact_phone" style={labelStyle}>
          Emergency contact phone
        </label>
        <input
          id="emergency_contact_phone"
          name="emergency_contact_phone"
          type="tel"
          defaultValue={initial.emergency_contact_phone}
          style={fieldStyle}
        />
      </div>

      {state?.ok === false && (
        <p style={{ fontSize: "0.8125rem", color: "#EF4444", margin: 0 }}>
          {state.error}
        </p>
      )}
      {state?.ok === true && (
        <p style={{ fontSize: "0.8125rem", color: "#22C55E", margin: 0 }}>
          Saved.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        style={{
          fontSize: "0.8125rem",
          fontWeight: 700,
          padding: "0.55rem 0.9rem",
          borderRadius: "var(--radius-sm)",
          border: "none",
          background: "var(--color-gold)",
          color: "#111",
          cursor: pending ? "wait" : "pointer",
          opacity: pending ? 0.7 : 1,
        }}
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
