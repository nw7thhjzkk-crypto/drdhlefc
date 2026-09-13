"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, type ForgotPasswordResult } from "./actions";

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState<
    ForgotPasswordResult | null,
    FormData
  >(requestPasswordReset, null);

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

          <p className="pub-login-lede">Reset your password</p>

          {state?.ok === false && (
            <div className="pub-login-error" role="alert">
              {state.error}
            </div>
          )}

          {state?.ok === true ? (
            <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
              <p style={{ fontSize: "0.875rem", color: "var(--color-silver)", marginBottom: "1rem" }}>
                If an account exists with that email, you will receive a password
                reset link shortly. Check your inbox and spam folder.
              </p>
              <Link
                href="/login"
                className="pub-btn pub-btn-outline pub-btn-lg"
                style={{ display: "inline-block", marginTop: "0.5rem" }}
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form className="pub-login-form" action={formAction}>
              <div className="pub-field">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={pending}
                className="pub-btn pub-btn-gold pub-btn-lg pub-btn-full"
              >
                {pending ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}

          <p className="pub-login-note" style={{ marginTop: "1.5rem" }}>
            <Link href="/login" style={{ color: "var(--color-gold)" }}>
              Back to sign in
            </Link>
          </p>
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
