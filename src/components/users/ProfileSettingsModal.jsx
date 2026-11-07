import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ShieldAlert, User as UserIcon, Lock, Key, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/auth';
import { usersApi } from '../../api/users';
import { useAuth } from '../../context/AuthContext';
import { useHotel } from '../../context/HotelContext';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import Badge from '../common/Badge';
import ConfirmModal from '../common/ConfirmModal';

const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  new_password_confirmation: z.string()
}).refine((data) => data.new_password === data.new_password_confirmation, {
  message: "Passwords don't match",
  path: ["new_password_confirmation"],
});

const ProfileSettingsModal = ({ isOpen, onClose }) => {
  const { user, refreshUser } = useAuth();
  const { activeHotelId } = useHotel();
  const [activeTab, setActiveTab] = useState('profile');
  const [isRevokeOpen, setIsRevokeOpen] = useState(false);

  const { data: loginHistoryData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['login_history'],
    queryFn: () => authApi.getLoginHistory(),
    enabled: isOpen && activeTab === 'security',
  });

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

  const profileMutation = useMutation({
    mutationFn: async (data) => {
      if (activeHotelId && user?.id) {
        return usersApi.updateUser(activeHotelId, user.id, data);
      }
      // Fallback local update if no hotel context is active
      const updated = { ...user, ...data };
      localStorage.setItem('hotelia_user', JSON.stringify(updated));
      return { data: updated };
    },
    onSuccess: async () => {
      if (refreshUser) {
        await refreshUser();
      }
      toast.success('Profile updated successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
  });

  const passwordMutation = useMutation({
    mutationFn: (data) => authApi.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed successfully');
      resetPassword();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
  });

  const revokeMutation = useMutation({
    mutationFn: () => authApi.logoutAllDevices(),
    onSuccess: () => {
      setIsRevokeOpen(false);
      toast.success('All other devices have been signed out');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to sign out other devices');
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

            <div className="pt-6 border-t border-zinc-100">
              <h4 className="text-sm font-semibold text-zinc-900 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-500" />
                Recent Login Activity
              </h4>
              {isLoadingHistory ? (
                <p className="text-xs text-zinc-400">Loading login history...</p>
              ) : (loginHistoryData?.data || []).length === 0 ? (
                <p className="text-xs text-zinc-500">No recent login history recorded.</p>
              ) : (
                <div className="max-h-48 overflow-y-auto divide-y divide-zinc-100 border border-zinc-200 rounded-lg">
                  {(loginHistoryData?.data || []).slice(0, 10).map((entry, idx) => (
                    <div key={entry.id || idx} className="px-3 py-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-medium text-zinc-900">{entry.ip_address || 'Unknown IP'}</span>
                        <span className="text-zinc-500 block truncate max-w-xs">{entry.user_agent || 'Browser session'}</span>
                      </div>
                      <div className="text-right">
                        <Badge variant={entry.successful === false ? 'danger' : 'success'}>
                          {entry.successful === false ? 'Failed' : 'Success'}
                        </Badge>
                        {entry.created_at && (
                          <span className="block text-[11px] text-zinc-400 mt-0.5">
                            {new Date(entry.created_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
