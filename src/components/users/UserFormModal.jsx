import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { usersApi } from '../../api/users';
import { useHotel } from '../../context/HotelContext';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';

const userSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  role_id: z.coerce.number().min(1, 'Role is required'),
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

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(userSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (user) {
        reset({
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role_id: user.role?.id || '',
          password: '',
        });
      } else {
        reset({ first_name: '', last_name: '', email: '', role_id: '', password: '' });
      }
    }
  }, [isOpen, user, reset]);

  const mutation = useMutation({
    mutationFn: (data) => {
      // Don't send empty password when editing
      const payload = { ...data };
      if (isEditing && !payload.password) {
        delete payload.password;
      }
      return isEditing 
        ? usersApi.updateUser(activeHotelId, user.id, payload) 
        : usersApi.createUser(activeHotelId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users', activeHotelId]);
      onClose();
    }
  });

  const roleOptions = rolesData?.data?.map(r => ({ label: r.name, value: r.id })) || [];

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
        <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
        
        <Select 
          label="Role" 
          options={[{ label: 'Select Role', value: '' }, ...roleOptions]}
          disabled={isLoadingRoles}
          {...register('role_id')} 
          error={errors.role_id?.message} 
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
