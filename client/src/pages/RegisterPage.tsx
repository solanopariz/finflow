import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { FormField } from '../components/FormField.tsx';
import { ApiError } from '../lib/api.ts';
import { useAuth } from '../lib/auth/context.ts';
import { registerSchema, type RegisterValues } from '../lib/auth/schemas.ts';
import { AuthShell } from './LoginPage.tsx';

export function RegisterPage() {
  const { register: registerUser, status } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  if (status === 'authenticated') {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(values: RegisterValues) {
    setFormError(null);
    try {
      await registerUser(values.name, values.email, values.password);
      navigate('/', { replace: true });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Não foi possível criar a conta');
    }
  }

  return (
    <AuthShell title="Criar conta" subtitle="Comece a organizar suas finanças">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          id="name"
          label="Nome"
          type="text"
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />
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
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        {formError && <p className="text-sm text-red-600">{formError}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-sky-600 px-4 py-2 font-medium text-white transition hover:bg-sky-700 disabled:opacity-60"
        >
          {isSubmitting ? 'Criando…' : 'Criar conta'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        Já tem conta?{' '}
        <Link to="/login" className="font-medium text-sky-600 hover:underline">
          Entrar
        </Link>
      </p>
    </AuthShell>
  );
}
