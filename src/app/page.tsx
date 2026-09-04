import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

// Root page: redirects authenticated users to their dashboard,
// shows public landing for unauthenticated visitors.
export default async function RootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role === "owner")   redirect("/owner/dashboard");
    if (profile?.role === "trainer") redirect("/trainer/dashboard");
    if (profile?.role === "member")  redirect("/member/home");
  }

  // Public landing — unauthenticated visitors
  return <PublicLanding />;
}

function PublicLanding() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--color-bg-primary)",
        color: "var(--color-text-primary)",
        fontFamily: "var(--font-sans)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Nav */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 1.5rem",
          borderBottom: "1px solid rgba(201,168,76,0.15)",
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(8px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <span style={{ fontSize: "1.5rem" }}>🏆</span>
          <div>
            <div
              style={{
                fontSize: "0.875rem",
                fontWeight: 800,
                letterSpacing: "0.1em",
                color: "var(--color-gold)",
                textTransform: "uppercase",
                lineHeight: 1.1,
              }}
            >
              DR DHL
            </div>
            <div
              style={{
                fontSize: "0.5625rem",
                letterSpacing: "0.15em",
                color: "var(--color-silver-dark)",
                textTransform: "uppercase",
              }}
            >
              Elite Fitness Club
            </div>
          </div>
        </div>
        <Link
          href="/login"
          style={{
            padding: "0.4rem 1rem",
            border: "1px solid var(--color-gold)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-gold)",
            fontSize: "0.8125rem",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Member Login
        </Link>
      </header>

      {/* Hero */}
      <section
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "5rem 1.5rem 3rem",
          background: "radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 70%)",
        }}
      >
        <div
          style={{
            display: "inline-block",
            fontSize: "0.6875rem",
            fontWeight: 700,
            letterSpacing: "0.2em",
            color: "var(--color-gold)",
            textTransform: "uppercase",
            border: "1px solid rgba(201,168,76,0.4)",
            padding: "0.3rem 0.875rem",
            borderRadius: "9999px",
            marginBottom: "1.5rem",
          }}
        >
          Premium Fitness Experience
        </div>
        <h1
          style={{
            fontSize: "clamp(2.5rem, 8vw, 4.5rem)",
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: "#fff",
            marginBottom: "0.5rem",
          }}
        >
          DR DHL
        </h1>
        <h2
          style={{
            fontSize: "clamp(1rem, 4vw, 1.75rem)",
            fontWeight: 400,
            letterSpacing: "0.25em",
            color: "var(--color-gold)",
            textTransform: "uppercase",
            marginBottom: "1.5rem",
          }}
        >
          Elite Fitness Club
        </h2>
        <div
          style={{
            width: "4rem",
            height: "2px",
            background: "linear-gradient(90deg, transparent, var(--color-gold), transparent)",
            margin: "0 auto 1.5rem",
          }}
        />
        <p
          style={{
            maxWidth: "560px",
            fontSize: "1.0625rem",
            color: "var(--color-silver)",
            lineHeight: 1.7,
            marginBottom: "2.5rem",
          }}
        >
          Transform your body. Elevate your performance. Train with purpose
          under expert guidance in a premium environment.
        </p>
        <div style={{ display: "flex", gap: "0.875rem", flexWrap: "wrap", justifyContent: "center" }}>
          <Link
            href="/login"
            style={{
              padding: "0.875rem 2rem",
              background: "var(--color-gold)",
              color: "#000",
              fontWeight: 800,
              fontSize: "0.9375rem",
              borderRadius: "var(--radius-md)",
              textDecoration: "none",
              letterSpacing: "0.04em",
            }}
          >
            Member Login →
          </Link>
          <a
            href="#contact"
            style={{
              padding: "0.875rem 2rem",
              border: "1px solid rgba(201,168,76,0.4)",
              color: "var(--color-gold)",
              fontWeight: 600,
              fontSize: "0.9375rem",
              borderRadius: "var(--radius-md)",
              textDecoration: "none",
            }}
          >
            Contact Us
          </a>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "3rem 1.5rem", background: "var(--color-bg-secondary)" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h3
            style={{
              textAlign: "center",
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "#fff",
              marginBottom: "0.5rem",
            }}
          >
            Everything You Need
          </h3>
          <p style={{ textAlign: "center", color: "var(--color-silver-dark)", marginBottom: "2rem", fontSize: "0.9375rem" }}>
            A complete fitness ecosystem — personalised for every member.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
            }}
          >
            {FEATURES.map((f) => (
              <div
                key={f.title}
                style={{
                  background: "var(--color-bg-card)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "var(--radius-lg)",
                  padding: "1.25rem",
                }}
              >
                <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>{f.icon}</div>
                <div style={{ fontWeight: 700, color: "#fff", marginBottom: "0.3rem" }}>{f.title}</div>
                <div style={{ fontSize: "0.8125rem", color: "var(--color-silver-dark)", lineHeight: 1.5 }}>
                  {f.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section
        id="contact"
        style={{ padding: "3rem 1.5rem", textAlign: "center" }}
      >
        <h3
          style={{
            fontSize: "1.375rem",
            fontWeight: 800,
            color: "var(--color-gold)",
            marginBottom: "0.75rem",
          }}
        >
          Get In Touch
        </h3>
        <p style={{ color: "var(--color-silver)", marginBottom: "1.25rem", fontSize: "0.9375rem" }}>
          Ready to start your fitness journey? Contact us to enquire about membership.
        </p>
        <Link
          href="/login"
          style={{
            display: "inline-block",
            padding: "0.75rem 2rem",
            background: "var(--color-gold)",
            color: "#000",
            fontWeight: 800,
            borderRadius: "var(--radius-md)",
            textDecoration: "none",
          }}
        >
          Member Portal →
        </Link>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "1.25rem 1.5rem",
          textAlign: "center",
          fontSize: "0.75rem",
          color: "var(--color-text-muted)",
        }}
      >
        © {new Date().getFullYear()} DR DHL Elite Fitness Club. All rights reserved.
      </footer>
    </div>
  );
}

const FEATURES = [
  { icon: "💪", title: "Expert Trainers",       body: "Work with certified coaches dedicated to your assigned programme." },
  { icon: "🥗", title: "Personalised Diet",      body: "Structured meal plans tailored to your goals and preferences." },
  { icon: "📊", title: "Progress Tracking",      body: "Detailed body assessments and visual progress over time." },
  { icon: "🗓️", title: "Group Activities",        body: "Yoga, HIIT, Zumba, and more — book your spot instantly." },
  { icon: "✅", title: "Attendance Tracking",    body: "Seamless check-in so you never lose a workout session." },
  { icon: "📱", title: "Mobile App",             body: "Access everything from your phone — installable PWA included." },
];
