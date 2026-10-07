import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { ShieldAlert, User as UserIcon, Lock, Key } from 'lucide-react';
import { authApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import ConfirmModal from '../common/ConfirmModal';

const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  new_password_confirmation: z.string()
}).refine((data) => data.new_password === data.new_password_confirmation, {
  message: "Passwords don't match",
  path: ["new_password_confirmation"],
});

const ProfileSettingsModal = ({ isOpen, onClose }) => {
  const { user, refreshUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isRevokeOpen, setIsRevokeOpen] = useState(false);

  const { register: regProfile, handleSubmit: handleProfileSubmit, reset: resetProfile, formState: { errors: profileErrors, isDirty: isProfileDirty } } = useForm({
    resolver: zodResolver(profileSchema),
  });

  const { register: regPassword, handleSubmit: handlePasswordSubmit, reset: resetPassword, formState: { errors: passwordErrors } } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (isOpen && user) {
      resetProfile({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
      resetPassword({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      });
      setActiveTab('profile');
    }
  }, [isOpen, user, resetProfile, resetPassword]);

  // Assuming an endpoint exists to update profile: /api/v1/auth/profile or /api/v1/users/{id}
  // We'll use a placeholder mutation for profile update since it might not be in auth.js yet
  const profileMutation = useMutation({
    mutationFn: (data) => fetch('/api/v1/auth/me', {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('hotelia_token')}`
      },
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: () => {
      refreshUser();
      alert('Profile updated successfully');
    }
  });

  const passwordMutation = useMutation({
    mutationFn: (data) => authApi.changePassword(data),
    onSuccess: () => {
      alert('Password changed successfully');
      resetPassword();
    }
  });

  const revokeMutation = useMutation({
    mutationFn: () => authApi.logoutAllDevices(),
    onSuccess: () => {
      setIsRevokeOpen(false);
      alert('All other devices have been signed out.');
    }
  });

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Account Settings"
        description="Manage your profile, password, and security preferences."
        maxWidth="max-w-2xl"
        footer={null}
      >
        <div className="border-b border-zinc-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                ${activeTab === 'profile'
                  ? 'border-zinc-900 text-zinc-900'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'}
              `}
            >
              <UserIcon className="w-4 h-4" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                ${activeTab === 'security'
                  ? 'border-zinc-900 text-zinc-900'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'}
              `}
            >
              <ShieldAlert className="w-4 h-4" />
              Security
            </button>
          </nav>
        </div>

        {activeTab === 'profile' && (
          <form className="space-y-6" onSubmit={handleProfileSubmit(data => profileMutation.mutate(data))}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="First Name" {...regProfile('first_name')} error={profileErrors.first_name?.message} />
              <Input label="Last Name" {...regProfile('last_name')} error={profileErrors.last_name?.message} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Email Address" type="email" {...regProfile('email')} error={profileErrors.email?.message} />
              <Input label="Phone Number" {...regProfile('phone')} error={profileErrors.phone?.message} />
            </div>
            
            <div className="flex justify-end pt-4 border-t border-zinc-100">
              <Button type="button" variant="secondary" onClick={onClose} className="mr-3">Cancel</Button>
              <Button type="submit" isLoading={profileMutation.isPending} disabled={!isProfileDirty || profileMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        )}

        {activeTab === 'security' && (
          <div className="space-y-8">
            <form className="space-y-4" onSubmit={handlePasswordSubmit(data => passwordMutation.mutate(data))}>
              <h4 className="text-sm font-semibold text-zinc-900">Change Password</h4>
              {passwordMutation.isError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {passwordMutation.error?.response?.data?.message || 'Failed to change password. Check your current password.'}
                </div>
              )}
              
              <Input label="Current Password" type="password" {...regPassword('current_password')} error={passwordErrors.current_password?.message} />
              <Input label="New Password" type="password" {...regPassword('new_password')} error={passwordErrors.new_password?.message} />
              <Input label="Confirm New Password" type="password" {...regPassword('new_password_confirmation')} error={passwordErrors.new_password_confirmation?.message} />
              
              <div className="flex justify-end pt-2">
                <Button type="submit" isLoading={passwordMutation.isPending}>
                  <Key className="w-4 h-4 mr-2" />
                  Update Password
                </Button>
              </div>
            </form>

            <div className="pt-6 border-t border-zinc-100">
              <h4 className="text-sm font-semibold text-zinc-900 mb-2">Device Management</h4>
              <p className="text-sm text-zinc-500 mb-4">
                If you noticed suspicious activity or lost a device, you can sign out of all other active sessions across all devices.
              </p>
              <Button variant="danger" onClick={() => setIsRevokeOpen(true)}>
                <Lock className="w-4 h-4 mr-2" />
                Sign Out All Other Devices
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={isRevokeOpen}
        onClose={() => setIsRevokeOpen(false)}
        onConfirm={() => revokeMutation.mutate()}
        title="Sign Out All Other Devices"
        description="This will instantly log out all active sessions except your current one. Users on other devices will be required to log in again."
        confirmText="Sign Out Everywhere"
        isDestructive={true}
        isLoading={revokeMutation.isPending}
      />
    </>
  );
};

export default ProfileSettingsModal;
