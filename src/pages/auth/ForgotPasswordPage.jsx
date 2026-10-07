import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Hotel, ArrowLeft, Mail } from 'lucide-react';
import { authApi } from '../../api/auth';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const ForgotPasswordPage = () => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (data) => authApi.forgotPassword(data),
    onSuccess: () => {
      setIsSuccess(true);
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) clearInterval(timer);
          return prev - 1;
        });
      }, 1000);
    },
  });

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center">
            <Hotel className="w-6 h-6 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-zinc-900">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-600">
          Or{' '}
          <Link to="/login" className="font-medium text-zinc-900 hover:underline">
            return to login
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-xl sm:px-10 border border-zinc-200">
          {isSuccess ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-zinc-900 mb-2">Check your email</h3>
              <p className="text-sm text-zinc-500 mb-6">
                We have sent a password reset link to your email address. Please click the link to reset your password.
              </p>
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={handleSubmit(data => mutation.mutate(data))}
                disabled={countdown > 0 || mutation.isPending}
              >
                {countdown > 0 ? `Resend email in ${countdown}s` : 'Resend email'}
              </Button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit(data => mutation.mutate(data))}>
              {mutation.isError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {mutation.error?.response?.data?.message || 'Something went wrong. Please try again.'}
                </div>
              )}

              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                {...register('email')}
                error={errors.email?.message}
                placeholder="admin@hotel.com"
              />

              <Button
                type="submit"
                className="w-full"
                isLoading={mutation.isPending}
              >
                Send reset link
              </Button>
            </form>
          )}

          <div className="mt-6">
            <Link to="/login" className="flex items-center justify-center text-sm font-medium text-zinc-600 hover:text-zinc-900">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
