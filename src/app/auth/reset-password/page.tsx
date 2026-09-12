"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { resetPassword, type ResetPasswordResult } from "./actions";

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

export default function ResetPasswordPage() {
  const router = useRouter();
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  const [state, formAction, pending] = useActionState<
    ResetPasswordResult | null,
    FormData
  >(resetPassword, null);

  useEffect(() => {
    async function exchangeToken() {
      const supabase = createClient();
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          setSessionError("Invalid or expired reset link. Please request a new one.");
        } else {
          setSessionReady(true);
        }
        window.history.replaceState({}, "", "/auth/reset-password");
      } else {
        setSessionError("Invalid reset link. Please request a new one.");
      }
    }
    exchangeToken();
  }, []);

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
      setClientError("Password must contain at least one number");
      return;
    }
    if (newPw !== confirmPw) {
      e.preventDefault();
      setClientError("Passwords do not match");
      return;
    }
    setClientError(null);
  }

  useEffect(() => {
    if (state?.ok === true) {
      const timer = setTimeout(() => router.push("/login"), 2000);
      return () => clearTimeout(timer);
    }
  }, [state, router]);

  return (
    <div className="public-site pub-login">
      <main className="pub-login-wrap">
        <div className="pub-login-card">
          <div className="pub-login-brand">
            <h1>
              Dr DHL
              <span>Elite Fitness Club</span>
            </h1>
          </div>

          <p className="pub-login-lede">Set new password</p>

          {sessionError && (
            <div className="pub-login-error" role="alert">
              {sessionError}
              <p style={{ marginTop: "0.75rem" }}>
                <Link href="/auth/forgot-password" style={{ color: "var(--color-gold)" }}>
                  Request a new reset link
                </Link>
              </p>
            </div>
          )}

          {!sessionReady && !sessionError && (
            <p style={{ textAlign: "center", color: "var(--color-silver)", fontSize: "0.875rem", padding: "1.5rem 0" }}>
              Verifying reset link…
            </p>
          )}

          {sessionReady && state?.ok !== true && (
            <form className="pub-login-form" action={formAction} onSubmit={handleSubmit}>
              <div className="pub-field">
                <label htmlFor="new_password">New password</label>
                <input
                  id="new_password"
                  name="new_password"
                  type={showNew ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  style={fieldStyle}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((s) => !s)}
                  style={{
                    position: "absolute",
                    right: "0.5rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--color-silver-dark)",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                  }}
                >
                  {showNew ? "Hide" : "Show"}
                </button>
              </div>

              <div className="pub-field">
                <label htmlFor="confirm_password">Confirm new password</label>
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  style={fieldStyle}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  style={{
                    position: "absolute",
                    right: "0.5rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--color-silver-dark)",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                  }}
                >
                  {showConfirm ? "Hide" : "Show"}
                </button>
              </div>

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

              <button
                type="submit"
                disabled={pending}
                className="pub-btn pub-btn-gold pub-btn-lg pub-btn-full"
              >
                {pending ? "Resetting…" : "Reset password"}
              </button>
            </form>
          )}

          {state?.ok === true && (
            <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
              <p style={{ fontSize: "0.875rem", color: "var(--color-silver)", marginBottom: "0.5rem" }}>
                Password reset successfully. Redirecting to sign in…
              </p>
              <Link
                href="/login"
                className="pub-btn pub-btn-outline pub-btn-lg"
                style={{ display: "inline-block", marginTop: "0.5rem" }}
              >
                Sign in now
              </Link>
            </div>
          )}
        </div>

        <p className="pub-login-back">
          <Link href="/">Back to the club</Link>
          <span aria-hidden="true">·</span>
          <span>© {new Date().getFullYear()} Dr DHL Elite Fitness Club</span>
        </p>
      </main>
    </div>
  );
}
