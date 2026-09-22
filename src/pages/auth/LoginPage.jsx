import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Hotel, KeyRound } from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import AccountLockoutBanner from '../../components/auth/AccountLockoutBanner';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const LoginPage = () => {
  const { login } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setErrorMsg('');
    try {
      const response = await authApi.login(data);
      if (response.token && response.user) {
        login(response);
      }
    } catch (error) {
      if (error.response?.status === 423) {
        setIsLocked(true);
      } else if (error.response?.status === 422 || error.response?.status === 401) {
        setErrorMsg('Invalid email or password');
      } else {
        setErrorMsg('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center shadow-sm">
            <Hotel className="w-6 h-6 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-zinc-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-600">
          Hotelia Property Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-zinc-200 sm:rounded-xl sm:px-10">
          {isLocked ? (
            <AccountLockoutBanner />
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
                  {errorMsg}
                </div>
              )}
              
              <Input 
                label="Email address" 
                type="email" 
                placeholder="admin@hotelia.app"
                {...register('email')}
                error={errors.email?.message}
              />

              <Input 
                label="Password" 
                type="password" 
                {...register('password')}
                error={errors.password?.message}
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-zinc-900">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="/forgot-password" className="font-medium text-zinc-600 hover:text-zinc-900">
                    Forgot your password?
                  </a>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full justify-center" 
                isLoading={isSubmitting}
              >
                <KeyRound className="w-4 h-4 mr-2" />
                Sign in
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
