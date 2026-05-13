import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

export default function Login() {
  const { login, session } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session?.token) nav('/dashboard', { replace: true });
  }, [session?.token, nav]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await login(email, password);
    setBusy(false);
    if (res.ok) nav('/dashboard', { replace: true });
    else setError(res.error || 'Login failed');
  };

  return (
    <div className="min-h-full bg-[#f8fafc] flex items-start justify-center pt-16 sm:pt-24 px-6">
      <div className="w-full max-w-md">
        {/* Logo + brand mark, mirroring mobile */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white text-xl font-extrabold shadow-[0_2px_8px_rgba(59,130,246,0.35)]">
            M
          </div>
        </div>

        <h1 className="text-[28px] font-extrabold tracking-tight text-[#0f172a] mb-6">
          MEC2 Tracker
        </h1>

        <form onSubmit={onSubmit} noValidate>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />

          <div className="mt-3.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error ? (
            <p className="mt-3 text-sm font-medium text-[#dc2626]">{error}</p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="mt-6 w-full"
            disabled={busy || !email || !password}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        
      </div>
    </div>
  );
}
