"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { submitWebsiteLead } from "@/app/actions/submit-website-lead";
import { FITNESS_GOALS, INTERESTS, site } from "@/lib/site";
import type { FieldErrors } from "@/lib/website-lead";

const FIELD_ORDER: Array<keyof FieldErrors> = [
  "name",
  "phone",
  "email",
  "goal",
  "interest",
];

export function LeadForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      let result: Awaited<ReturnType<typeof submitWebsiteLead>>;
      try {
        result = await submitWebsiteLead({
          name: String(data.get("name") ?? ""),
          phone: String(data.get("phone") ?? ""),
          email: String(data.get("email") ?? ""),
          goal: String(data.get("goal") ?? ""),
          interest: String(data.get("interest") ?? ""),
          message: String(data.get("message") ?? ""),
          company: String(data.get("company") ?? ""),
        });
      } catch {
        setError(
          "We could not receive your enquiry. Please try again, or email us."
        );
        return;
      }

      if (result.ok) {
        setSuccess(true);
        form.reset();
        return;
      }

      setError(result.error);
      setFieldErrors(result.fieldErrors ?? {});

      // Move focus to the first invalid field so the error is announced.
      requestAnimationFrame(() => {
        const field = FIELD_ORDER.find((key) => result.fieldErrors?.[key]);
        if (field) {
          formRef.current?.querySelector<HTMLElement>(
            `[name="${field}"]`
          )?.focus();
        }
      });
    });
  }

  if (success) {
    return (
      <div className="pub-lead-success" role="status">
        <p className="pub-kicker">Thank you</p>
        <h3>Your interest has been received.</h3>
        <p>
          Our team will be in touch. This is an enquiry — not a membership, and
          not an account.
        </p>
        <button
          type="button"
          className="pub-btn pub-btn-outline"
          onClick={() => setSuccess(false)}
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      className="pub-form"
      onSubmit={onSubmit}
      noValidate
      aria-busy={pending}
    >
      <div className="pub-field-row">
        <div className="pub-field">
          <label htmlFor="lead-name">Name</label>
          <input
            id="lead-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={80}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? "lead-name-error" : undefined}
          />
          {fieldErrors.name ? (
            <p id="lead-name-error" className="pub-field-error">
              {fieldErrors.name}
            </p>
          ) : null}
        </div>

        <div className="pub-field">
          <label htmlFor="lead-phone">Mobile number</label>
          <input
            id="lead-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            placeholder="10-digit mobile"
            aria-invalid={Boolean(fieldErrors.phone)}
            aria-describedby={fieldErrors.phone ? "lead-phone-error" : undefined}
          />
          {fieldErrors.phone ? (
            <p id="lead-phone-error" className="pub-field-error">
              {fieldErrors.phone}
            </p>
          ) : null}
        </div>
      </div>

      <div className="pub-field">
        <label htmlFor="lead-email">Email</label>
        <input
          id="lead-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Optional"
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "lead-email-error" : undefined}
        />
        {fieldErrors.email ? (
          <p id="lead-email-error" className="pub-field-error">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className="pub-field-row">
        <div className="pub-field">
          <label htmlFor="lead-goal">Fitness goal</label>
          <select
            id="lead-goal"
            name="goal"
            required
            defaultValue=""
            aria-invalid={Boolean(fieldErrors.goal)}
          >
            <option value="" disabled>
              Select a goal
            </option>
            {FITNESS_GOALS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
          {fieldErrors.goal ? (
            <p className="pub-field-error">{fieldErrors.goal}</p>
          ) : null}
        </div>
        <div className="pub-field">
          <label htmlFor="lead-interest">Interest</label>
          <select
            id="lead-interest"
            name="interest"
            required
            defaultValue="early-access"
            aria-invalid={Boolean(fieldErrors.interest)}
          >
            {INTERESTS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
          {fieldErrors.interest ? (
            <p className="pub-field-error">{fieldErrors.interest}</p>
          ) : null}
        </div>
      </div>

      <div className="pub-field">
        <label htmlFor="lead-message">Message</label>
        <textarea
          id="lead-message"
          name="message"
          rows={4}
          maxLength={1000}
          placeholder="Optional"
        />
      </div>

      <div className="pub-honeypot" aria-hidden="true">
        <label htmlFor="lead-company">Company</label>
        <input
          id="lead-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {error ? (
        <p className="pub-form-error" role="alert">
          {error} You can also write to{" "}
          <a href={`mailto:${site.email}`}>{site.email}</a>.
        </p>
      ) : null}

      <button
        type="submit"
        className="pub-btn pub-btn-gold pub-btn-lg pub-btn-full"
        disabled={pending}
      >
        {pending ? "Sending…" : "Get Early Access"}
      </button>
      <p className="pub-form-note">
        Submitting this form creates an enquiry for our team. It does not create
        a member account. See our <a href="/privacy">Privacy Policy</a>.
      </p>
    </form>
  );
}
