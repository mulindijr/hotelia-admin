import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Hotel, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth';

const registerSchema = z.object({
  company_name: z.string().min(2, 'Company name is required'),
  domain: z.string().min(2, 'Domain is required').regex(/^[a-z0-9-]+$/, 'Domain must be lowercase alphanumeric and hyphens only'),
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().min(2, 'Last name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const RegisterPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    setErrorMsg('');
    try {
      const response = await authApi.register(data);
      if (response.token && response.user) {
        // Automatically log them in after registration
        login(response);
        navigate('/');
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        // Collect validation errors from backend
        const msgs = Object.values(error.response.data.errors).flat();
        setErrorMsg(msgs.join(', '));
      } else if (error.response?.data?.message) {
        setErrorMsg(error.response.data.message);
      } else {
        setErrorMsg('An unexpected error occurred during registration. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center shadow-sm">
            <Hotel className="w-6 h-6 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-zinc-900">
          Create your Hotelia Workspace
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-600">
          Get started with our Multi-Tenant PMS Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-4 shadow-sm border border-zinc-200 sm:rounded-xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
                {errorMsg}
              </div>
            )}
            
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-zinc-900 border-b pb-2">Company Details</h3>
              
              <Input 
                label="Company Name" 
                placeholder="Marriott Group"
                {...register('company_name')}
                error={errors.company_name?.message}
              />
              
              <Input 
                label="Workspace Domain" 
                placeholder="marriott"
                {...register('domain')}
                error={errors.domain?.message}
                helpText="This will be used to uniquely identify your login space."
              />
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="text-sm font-medium text-zinc-900 border-b pb-2">Admin Profile</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="First Name" 
                  {...register('first_name')}
                  error={errors.first_name?.message}
                />
                <Input 
                  label="Last Name" 
                  {...register('last_name')}
                  error={errors.last_name?.message}
                />
              </div>

              <Input 
                label="Work Email" 
                type="email" 
                placeholder="admin@marriott.com"
                {...register('email')}
                error={errors.email?.message}
              />
              
              <Input 
                label="Phone Number" 
                type="tel"
                placeholder="+1 234 567 890"
                {...register('phone')}
                error={errors.phone?.message}
              />

              <Input 
                label="Password" 
                type="password" 
                {...register('password')}
                error={errors.password?.message}
              />
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full justify-center" 
                isLoading={isSubmitting}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Register Workspace
              </Button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-zinc-900 hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
