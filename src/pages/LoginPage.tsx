import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/Inputs';

type Mode = 'SESSION' | 'IDENTITY';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface Errors {
  email?: string;
  password?: string;
  confirm?: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const reduced = useReducedMotion();

  const [mode, setMode] = useState<Mode>('SESSION');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = mode === 'SESSION' ? 'Initialize Session — BUTCHER PROTOCOL' : 'Create Identity — BUTCHER PROTOCOL';
  }, [mode]);

  const validate = (): Errors => {
    const next: Errors = {};
    if (!email.trim()) {
      next.email = 'Email is required.';
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      next.email = 'Enter a valid email address.';
    }
    if (!password) {
      next.password = 'Password is required.';
    } else if (mode === 'IDENTITY' && password.length < 8) {
      next.password = 'Use at least 8 characters.';
    }
    if (mode === 'IDENTITY') {
      if (!displayName.trim()) next.confirm = 'Display name is required.';
      if (confirm !== password) next.confirm = next.confirm ?? 'Passwords do not match.';
    }
    return next;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    // UI-only flow. No credentials are stored, transmitted or validated anywhere.
    window.setTimeout(() => {
      setSubmitting(false);
      navigate('/dashboard');
    }, 800);
  };

  const switchMode = () => {
    setMode((current) => (current === 'SESSION' ? 'IDENTITY' : 'SESSION'));
    setErrors({});
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-canvas">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(680px 420px at 50% 0%, rgba(225,29,56,0.16), transparent 62%), linear-gradient(to bottom, rgba(5,5,6,0) 55%, var(--bg-base) 100%)',
        }}
      />
      <div aria-hidden="true" className="u-noise pointer-events-none absolute inset-0" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-display text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted transition-colors hover:text-primary"
        >
          <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
          Back
        </Link>
        <span className="font-display text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-muted">
          Phase 01 · Interface only
        </span>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 pb-20 pt-4 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: reduced ? 0 : 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center">
            <span
              aria-hidden="true"
              className="mx-auto mb-5 grid h-11 w-11 place-items-center rounded-[3px] border border-signal-dim bg-signal/10"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="var(--signal-red)" strokeWidth="2">
                <path d="M5 5h4v9h8v5H5z" strokeLinejoin="round" />
                <circle cx="18" cy="8" r="3.2" />
              </svg>
            </span>
            <h1 className="u-page-title">
              {mode === 'SESSION' ? 'Initialize Session' : 'Create Identity'}
            </h1>
            <p className="mt-2.5 text-sm leading-relaxed text-secondary">
              {mode === 'SESSION'
                ? 'Authenticate to open the command center.'
                : 'Register an operator identity for the command center.'}
            </p>
          </div>

          <div className="rounded-[5px] border border-border-subtle bg-surface p-6 u-shadow-panel sm:p-8">
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              {mode === 'IDENTITY' ? (
                <TextInput
                  label="Display Name"
                  value={displayName}
                  onChange={setDisplayName}
                  placeholder="Operator name"
                  autoComplete="name"
                  required
                />
              ) : null}

              <TextInput
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="operator@example.com"
                autoComplete="email"
                error={errors.email}
                required
              />

              <TextInput
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                autoComplete={mode === 'SESSION' ? 'current-password' : 'new-password'}
                error={errors.password}
                required
              />

              {mode === 'IDENTITY' ? (
                <TextInput
                  label="Confirm Password"
                  type="password"
                  value={confirm}
                  onChange={setConfirm}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  error={errors.confirm}
                  required
                />
              ) : null}

              <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
                {mode === 'SESSION' ? 'Initialize Session' : 'Create Identity'}
              </Button>
            </form>

            <div className="mt-5 flex items-start gap-2.5 rounded-[3px] border border-border-subtle bg-canvas/60 px-3.5 py-3">
              <ShieldAlert aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber" />
              <p className="text-[0.75rem] leading-relaxed text-muted">
                Interface demonstration only. Nothing entered here is transmitted, stored or validated. Real
                authentication arrives in Phase 02.
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-[0.8125rem] text-secondary">
            {mode === 'SESSION' ? 'No operator identity yet?' : 'Already registered?'}{' '}
            <button
              type="button"
              onClick={switchMode}
              className="font-display text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-signal underline-offset-4 hover:underline"
            >
              {mode === 'SESSION' ? 'Create Identity' : 'Initialize Session'}
            </button>
          </p>
        </motion.div>
      </main>
    </div>
  );
}