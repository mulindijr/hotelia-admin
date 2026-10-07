import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Hotel, ArrowRight, CheckCircle2 } from 'lucide-react';
import { authApi } from '../../api/auth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string()
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords don't match",
  path: ["password_confirmation"],
});

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const emailQuery = searchParams.get('email') || '';
  const navigate = useNavigate();
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: emailQuery,
      password: '',
      password_confirmation: ''
    }
  });

  const mutation = useMutation({
    mutationFn: (data) => authApi.resetPassword({ ...data, token }),
    onSuccess: () => {
      setIsSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    },
  });

  if (!token) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md bg-white p-8 rounded-xl shadow-sm border border-zinc-200 text-center">
           <h2 className="text-xl font-bold text-red-600 mb-2">Invalid Reset Link</h2>
           <p className="text-zinc-600 mb-6">This password reset link is missing or invalid.</p>
           <Link to="/forgot-password">
             <Button className="w-full">Request new link</Button>
           </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center">
            <Hotel className="w-6 h-6 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-zinc-900">
          Create new password
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-600">
          Your new password must be different from previous used passwords.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-xl sm:px-10 border border-zinc-200">
          {isSuccess ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-zinc-900 mb-2">Password reset successful</h3>
              <p className="text-sm text-zinc-500 mb-6">
                Your password has been successfully reset. Redirecting to login...
              </p>
              <Link to="/login">
                <Button className="w-full">
                  Continue to login <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit(data => mutation.mutate(data))}>
              {mutation.isError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {mutation.error?.response?.data?.message || 'Failed to reset password. The link might have expired.'}
                </div>
              )}

              <Input
                label="Email address"
                type="email"
                {...register('email')}
                error={errors.email?.message}
                readOnly={!!emailQuery}
                className={emailQuery ? "bg-zinc-50 text-zinc-500" : ""}
              />

              <Input
                label="New Password"
                type="password"
                {...register('password')}
                error={errors.password?.message}
              />
              
              <Input
                label="Confirm Password"
                type="password"
                {...register('password_confirmation')}
                error={errors.password_confirmation?.message}
              />

              <Button
                type="submit"
                className="w-full"
                isLoading={mutation.isPending}
              >
                Reset password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
