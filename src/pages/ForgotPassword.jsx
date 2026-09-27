import { useState } from "react";

// @ts-ignore
const Icon = ({ children, className = "" }) => (
  <span className={className} aria-hidden="true">{children}</span>
);

// @ts-ignore
const Mail = (props) => <Icon {...props}>✉</Icon>;
// @ts-ignore
const ArrowLeft = (props) => <Icon {...props}>←</Icon>;
// @ts-ignore
const Loader2 = (props) => <Icon {...props}>⟳</Icon>;

// @ts-ignore
const AuthLayout = ({ icon: PageIcon, title, subtitle, footer, children }) => (
  <main className="min-h-screen flex items-center justify-center p-6">
    <section className="w-full max-w-md space-y-6">
      <header className="text-center space-y-2">
        <PageIcon className="w-8 h-8 mx-auto" />
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </header>
      {children}
      <footer className="text-center">{footer}</footer>
    </section>
  </main>
);

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // @ts-ignore
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Connect the project's password-reset service here when available.
      await Promise.resolve(email);
    } catch {
      // Always show success regardless
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <AuthLayout
      icon={Mail}
      title="Reset password"
      subtitle="We'll send you a link to reset it"
      footer={
        <a href="/login" className="text-primary font-medium hover:underline">
          <ArrowLeft className="w-3 h-3 inline mr-1" />Back to log in
        </a>
      }
    >
      {sent ? (
        <p className="text-sm text-foreground text-center">
          If an account exists with that email, you'll receive a password reset link shortly.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12 w-full"
                required
              />
            </div>
          </div>
          <button type="submit" className="w-full h-12 font-medium" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              "Send reset link"
            )}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
