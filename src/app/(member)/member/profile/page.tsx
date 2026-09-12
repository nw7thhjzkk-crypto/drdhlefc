import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ProfileEditForm } from "./ProfileEditForm";
import { PasswordChangeForm } from "./PasswordChangeForm";

export const metadata: Metadata = { title: "Profile" };

export default async function MemberProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("members")
    .select(
      "id, name, member_code, phone, email, primary_goal, secondary_goal, status, diet_preference, fitness_level, emergency_contact_name, emergency_contact_phone",
    )
    .eq("profile_id", user.id)
    .maybeSingle();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, phone, role")
    .eq("id", user.id)
    .maybeSingle();

  const card: React.CSSProperties = {
    background: "var(--color-bg-card)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "var(--radius-lg)",
    padding: "1rem 1.125rem",
    marginBottom: "0.875rem",
  };

  if (!member) {
    return (
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        <div style={{ marginBottom: "1.25rem" }}>
          <Link
            href="/member/home"
            style={{
              fontSize: "0.75rem",
              color: "var(--color-gold)",
              textDecoration: "none",
            }}
          >
            ← Home
          </Link>
          <h1
            style={{
              fontSize: "1.25rem",
              fontWeight: 800,
              color: "#fff",
              marginTop: "0.5rem",
            }}
          >
            Profile
          </h1>
        </div>
        <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-zinc-800 bg-zinc-950/60 p-10 text-center">
          <h3 className="text-lg font-semibold text-yellow-500">
            Member profile not found
          </h3>
          <p className="max-w-md text-sm text-zinc-500">
            Contact the gym front desk to set up your account, then your
            details and edit form will show here.
          </p>
        </div>
      </div>
    );
  }

  const displayEmail = member.email || profile?.email || user.email || "—";
  const displayName = member.name || profile?.full_name || "Member";

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1.25rem" }}>
        <Link
          href="/member/home"
          style={{
            fontSize: "0.75rem",
            color: "var(--color-gold)",
            textDecoration: "none",
          }}
        >
          ← Home
        </Link>
        <h1
          style={{
            fontSize: "1.25rem",
            fontWeight: 800,
            color: "#fff",
            marginTop: "0.5rem",
          }}
        >
          Profile
        </h1>
        <p
          style={{
            fontSize: "0.8125rem",
            color: "var(--color-silver-dark)",
            marginTop: "0.2rem",
          }}
        >
          Your account details
        </p>
      </div>

      <div style={{ ...card, borderLeft: "3px solid var(--color-gold)" }}>
        <div
          style={{
            fontSize: "0.6875rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--color-silver-dark)",
            marginBottom: "0.75rem",
          }}
        >
          Account
        </div>
        <Row label="Name" value={displayName} />
        <Row label="Member code" value={member.member_code || "—"} />
        <Row label="Email" value={displayEmail} />
        <Row
          label="Status"
          value={
            <span
              className={`badge ${
                member.status === "active" ? "badge-success" : "badge-warning"
              }`}
              style={{ fontSize: "0.625rem", textTransform: "capitalize" }}
            >
              {member.status || "unknown"}
            </span>
          }
        />
        {member.fitness_level && (
          <Row label="Fitness level" value={member.fitness_level} />
        )}
      </div>

      <div style={card}>
        <div
          style={{
            fontSize: "0.6875rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--color-silver-dark)",
            marginBottom: "0.75rem",
          }}
        >
          Edit details
        </div>
        <ProfileEditForm
          initial={{
            phone: member.phone ?? "",
            primary_goal: member.primary_goal ?? "",
            secondary_goal: member.secondary_goal ?? "",
            diet_preference: member.diet_preference ?? "",
            emergency_contact_name: member.emergency_contact_name ?? "",
            emergency_contact_phone: member.emergency_contact_phone ?? "",
          }}
        />
      </div>

      <div style={card}>
        <div
          style={{
            fontSize: "0.6875rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--color-silver-dark)",
            marginBottom: "0.75rem",
          }}
        >
          Security
        </div>
        <PasswordChangeForm />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: "0.75rem",
        marginBottom: "0.5rem",
      }}
    >
      <span
        style={{
          fontSize: "0.75rem",
          color: "var(--color-silver-dark)",
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "0.875rem",
          color: "#fff",
          fontWeight: 600,
          textAlign: "right",
          wordBreak: "break-word",
        }}
      >
        {value}
      </span>
    </div>
  );
}
