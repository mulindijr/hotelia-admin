import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { usersApi } from '../../api/users';
import { useHotel } from '../../context/HotelContext';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

const DEFAULT_STAFF_ROLES = [
  { label: 'Hotel Manager', value: 'hotel_manager' },
  { label: 'Receptionist', value: 'receptionist' },
  { label: 'Housekeeper', value: 'housekeeper' },
  { label: 'Accountant', value: 'accountant' },
];

const formatRoleLabel = (name) =>
  name
    ? name
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
    : '';

const userSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Phone number is required'),
  role: z.string().min(1, 'Role is required'),
  is_active: z.boolean().optional(),
  password: z.string().optional(),
});

const UserFormModal = ({ isOpen, onClose, user }) => {
  const { activeHotelId } = useHotel();
  const queryClient = useQueryClient();
  const isEditing = !!user;

  const { data: rolesData, isLoading: isLoadingRoles } = useQuery({
    queryKey: ['roles', activeHotelId],
    queryFn: () => usersApi.getRoles(activeHotelId),
    enabled: isOpen && !!activeHotelId,
  });

  const { register, handleSubmit, reset, setError, formState: { errors } } = useForm({
    resolver: zodResolver(userSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (user) {
        const primaryRole =
          (Array.isArray(user.roles) && (typeof user.roles[0] === 'string' ? user.roles[0] : user.roles[0]?.name)) ||
          user.role?.name ||
          (typeof user.role === 'string' ? user.role : '') ||
          '';
        reset({
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email || '',
          phone: user.phone || '',
          role: primaryRole,
          is_active: user.is_active ?? true,
          password: '',
        });
      } else {
        reset({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          role: 'receptionist',
          is_active: true,
          password: '',
        });
      }
    }
  }, [isOpen, user, reset]);

  const mutation = useMutation({
    mutationFn: (data) => {
      const payload = { ...data };
      if (!payload.password) {
        delete payload.password;
      }
      return isEditing 
        ? usersApi.updateUser(activeHotelId, user.id, payload) 
        : usersApi.createUser(activeHotelId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', activeHotelId] });
      toast.success(isEditing ? 'Staff member updated successfully' : 'Staff member created successfully');
      onClose();
    },
    onError: (error) => {
      if (error.response?.status === 422 && error.response?.data?.errors) {
        Object.entries(error.response.data.errors).forEach(([field, messages]) => {
          setError(field, {
            type: 'server',
            message: Array.isArray(messages) ? messages[0] : messages,
          });
        });
      } else {
        toast.error(error.response?.data?.message || 'Failed to save staff user');
      }
    }
  });

  const apiRoles = rolesData?.data
    ?.filter(r => r.name !== 'super_admin')
    .map(r => ({ label: formatRoleLabel(r.name), value: r.name })) || [];
  const roleOptions = apiRoles.length > 0 ? apiRoles : DEFAULT_STAFF_ROLES;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Staff User' : 'Add Staff User'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit(data => mutation.mutate(data))} isLoading={mutation.isPending}>
            {isEditing ? 'Save Changes' : 'Create User'}
          </Button>
        </>
      }
    >
      <form className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="First Name" {...register('first_name')} error={errors.first_name?.message} />
          <Input label="Last Name" {...register('last_name')} error={errors.last_name?.message} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
          <Input label="Phone Number" placeholder="+254700000000" {...register('phone')} error={errors.phone?.message} />
        </div>
        
        <Select 
          label="Role" 
          options={[{ label: 'Select Role', value: '' }, ...roleOptions]}
          disabled={isLoadingRoles}
          {...register('role')} 
          error={errors.role?.message} 
        />

        <Input 
          label={isEditing ? "New Password (Optional)" : "Password"} 
          type="password" 
          {...register('password')} 
          error={errors.password?.message} 
        />
        {isEditing && <p className="text-xs text-zinc-500 -mt-2">Leave blank to keep current password.</p>}
      </form>
    </Modal>
  );
};

export default UserFormModal;
