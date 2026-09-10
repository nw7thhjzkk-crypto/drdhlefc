import Link from "next/link";
import { BrandMark } from "@/components/public/BrandMark";
import { login } from "./actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <div className="public-site pub-login">
      <main className="pub-login-wrap">
        <div className="pub-login-card">
          <div className="pub-login-brand">
            <div className="pub-login-mark">
              <BrandMark size={72} priority />
            </div>
            <h1>
              Dr DHL
              <span>Elite Fitness Club</span>
            </h1>
          </div>

          <p className="pub-login-lede">Sign in to your account</p>

          <ErrorBanner searchParams={searchParams} />

          <form className="pub-login-form">
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

            <div className="pub-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>

            <button
              formAction={login}
              type="submit"
              className="pub-btn pub-btn-gold pub-btn-lg pub-btn-full"
            >
              Sign In
            </button>
          </form>

          <p className="pub-login-note">
            Accounts are created by the gym administrator.
            <br />
            This is not a public registration form.
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

async function ErrorBanner({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  if (!params.error) return null;

  return (
    <div className="pub-login-error" role="alert">
      {params.error === "Invalid credentials"
        ? "Invalid email or password. Please try again."
        : params.error}
    </div>
  );
}
