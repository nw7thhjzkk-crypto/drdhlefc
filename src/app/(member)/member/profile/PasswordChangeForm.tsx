"use client";

import { useActionState, useState } from "react";
import { changePassword, type ChangePasswordResult } from "./actions";

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

const toggleBtnStyle: React.CSSProperties = {
  position: "absolute",
  right: "0.5rem",
  top: "50%",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  color: "var(--color-silver-dark)",
  fontSize: "0.75rem",
  cursor: "pointer",
  padding: "0.2rem 0.4rem",
};

function PasswordField({
  id,
  label,
  name,
  show,
  onToggle,
}: {
  id: string;
  label: string;
  name: string;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <label htmlFor={id} style={labelStyle}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          autoComplete={
            name === "current_password" ? "current-password" : "new-password"
          }
          required
          style={fieldStyle}
        />
        <button type="button" onClick={onToggle} style={toggleBtnStyle}>
          {show ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}

export function PasswordChangeForm() {
  const [state, formAction, pending] = useActionState<
    ChangePasswordResult | null,
    FormData
  >(changePassword, null);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    const data = new FormData(form);
    const newPw = String(data.get("new_password") ?? "");
    const confirmPw = String(data.get("confirm_password") ?? "");

    if (newPw.length < 8) {
      e.preventDefault();
      setClientError("Password must be at least 8 characters");
      return;
    }
    if (!/[A-Z]/.test(newPw)) {
      e.preventDefault();
      setClientError("Password must contain an uppercase letter");
      return;
    }
    if (!/[a-z]/.test(newPw)) {
      e.preventDefault();
      setClientError("Password must contain a lowercase letter");
      return;
    }
    if (!/[0-9]/.test(newPw)) {
      e.preventDefault();
      setClientError("Password must contain a number");
      return;
    }
    if (newPw !== confirmPw) {
      e.preventDefault();
      setClientError("Passwords do not match");
      return;
    }
    setClientError(null);
  }

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.875rem",
      }}
    >
      <PasswordField
        id="current_password"
        label="Current password"
        name="current_password"
        show={showCurrent}
        onToggle={() => setShowCurrent((s) => !s)}
      />

      <PasswordField
        id="new_password"
        label="New password"
        name="new_password"
        show={showNew}
        onToggle={() => setShowNew((s) => !s)}
      />

      <PasswordField
        id="confirm_password"
        label="Confirm new password"
        name="confirm_password"
        show={showConfirm}
        onToggle={() => setShowConfirm((s) => !s)}
      />

      {clientError && (
        <p style={{ fontSize: "0.8125rem", color: "#EF4444", margin: 0 }}>
          {clientError}
        </p>
      )}
      {state?.ok === false && (
        <p style={{ fontSize: "0.8125rem", color: "#EF4444", margin: 0 }}>
          {state.error}
        </p>
      )}
      {state?.ok === true && (
        <p style={{ fontSize: "0.8125rem", color: "#22C55E", margin: 0 }}>
          Password changed successfully
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
        {pending ? "Changing…" : "Change password"}
      </button>
    </form>
  );
}
