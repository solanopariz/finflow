import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { FormField } from '../components/FormField.tsx';
import { ApiError } from '../lib/api.ts';
import { useAuth } from '../lib/auth/context.ts';
import { loginSchema, type LoginValues } from '../lib/auth/schemas.ts';

const DEMO_EMAIL = 'demo@finflow.dev';
const DEMO_PASSWORD = 'demo1234';

export function LoginPage() {
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  if (status === 'authenticated') {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    try {
      await login(values.email, values.password);
      navigate('/', { replace: true });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Não foi possível entrar');
    }
  }

  async function enterDemo() {
    setFormError(null);
    setDemoLoading(true);
    try {
      await login(DEMO_EMAIL, DEMO_PASSWORD);
      navigate('/', { replace: true });
    } catch {
      setFormError('Conta de demonstração indisponível. Rode "npm run seed" no servidor.');
    } finally {
      setDemoLoading(false);
    }
  }

  return (
    <AuthShell title="Entrar" subtitle="Acesse sua conta do FinFlow">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          id="email"
          label="E-mail"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <FormField
          id="password"
          label="Senha"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        {formError && <p className="text-sm text-red-600">{formError}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-sky-600 px-4 py-2 font-medium text-white transition hover:bg-sky-700 disabled:opacity-60"
        >
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <div className="mt-4">
        <button
          type="button"
          onClick={enterDemo}
          disabled={demoLoading}
          className="w-full rounded-md border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-100 disabled:opacity-60"
        >
          {demoLoading ? 'Entrando…' : '🚀 Entrar na conta de demonstração'}
        </button>
      </div>

      <p className="mt-4 text-center text-sm text-slate-600">
        Não tem conta?{' '}
        <Link to="/register" className="font-medium text-sky-600 hover:underline">
          Criar conta
        </Link>
      </p>
    </AuthShell>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="text-xl font-bold text-sky-600">FinFlow 💸</div>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
