import { forwardRef, type InputHTMLAttributes } from 'react';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

/** Input rotulado com mensagem de erro, usado nos formulários de auth. */
export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(function FormField(
  { label, error, id, ...props },
  ref,
) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        ref={ref}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
});
