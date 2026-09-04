import { login } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--color-bg-primary)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
      }}
    >
      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          background: "var(--color-bg-card)",
          border: "1px solid rgba(201,168,76,0.2)",
          borderRadius: "var(--radius-xl)",
          padding: "2.5rem 2rem",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}
      >
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🏆</div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: "var(--color-gold)",
              textTransform: "uppercase",
              lineHeight: 1.2,
            }}
          >
            DR DHL
          </h1>
          <p
            style={{
              fontSize: "0.6875rem",
              letterSpacing: "0.18em",
              color: "var(--color-silver)",
              textTransform: "uppercase",
              fontWeight: 600,
              marginTop: "0.25rem",
            }}
          >
            Elite Fitness Club
          </p>
          <div className="gold-line" style={{ margin: "0.75rem auto 0" }} />
        </div>

        <p
          style={{
            textAlign: "center",
            fontSize: "0.875rem",
            color: "var(--color-silver)",
            marginBottom: "1.75rem",
          }}
        >
          Sign in to your account
        </p>

        {/* Error */}
        <ErrorBanner searchParams={searchParams} />

        {/* Form */}
        <form className="space-y-4" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="form-group">
            <label htmlFor="email" className="form-label" style={{ color: "var(--color-silver)" }}>
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="form-input form-input-dark"
              placeholder="you@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label" style={{ color: "var(--color-silver)" }}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="form-input form-input-dark"
              placeholder="••••••••"
            />
          </div>

          <button
            formAction={login}
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            style={{ marginTop: "0.5rem" }}
          >
            Sign In
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            fontSize: "0.75rem",
            color: "var(--color-text-muted)",
            marginTop: "1.5rem",
          }}
        >
          Accounts are created by the gym administrator.
          <br />
          Contact your gym manager for access.
        </p>
      </div>

      {/* Footer */}
      <p
        style={{
          marginTop: "1.5rem",
          fontSize: "0.6875rem",
          color: "var(--color-text-muted)",
          letterSpacing: "0.04em",
        }}
      >
        © {new Date().getFullYear()} DR DHL Elite Fitness Club
      </p>
    </div>
  );
}

// Async component to resolve searchParams
async function ErrorBanner({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  if (!params.error) return null;

  return (
    <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
      <span>⚠️</span>
      <span>
        {params.error === "Invalid credentials"
          ? "Invalid email or password. Please try again."
          : params.error}
      </span>
    </div>
  );
}
