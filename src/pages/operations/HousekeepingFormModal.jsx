import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { housekeepingApi } from '../../api/operations';
import { roomsApi } from '../../api/rooms';
import { usersApi } from '../../api/users';
import { useHotel } from '../../context/HotelContext';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';

const HousekeepingFormModal = ({ isOpen, onClose, task }) => {
  const { activeHotelId } = useHotel();
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      room_id: '',
      assigned_to: '',
      status: 'pending',
      scheduled_at: ''
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (task) {
        reset({
          room_id: task.room_id || '',
          assigned_to: task.assigned_to || '',
          status: task.status || 'pending',
          scheduled_at: task.scheduled_at ? new Date(task.scheduled_at).toISOString().slice(0, 16) : ''
        });
      } else {
        reset({
          room_id: '',
          assigned_to: '',
          status: 'pending',
          scheduled_at: ''
        });
      }
    }
  }, [isOpen, task, reset]);

  // Fetch Rooms for dropdown
  const { data: roomsData } = useQuery({
    queryKey: ['rooms', activeHotelId],
    queryFn: () => roomsApi.getRooms(activeHotelId, { perPage: 100 }),
    enabled: !!activeHotelId && isOpen,
  });

  // Fetch Users for assignment dropdown
  const { data: usersData } = useQuery({
    queryKey: ['users', activeHotelId],
    queryFn: () => usersApi.getUsers(activeHotelId, { perPage: 100 }),
    enabled: !!activeHotelId && isOpen,
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      // Clean up empty strings
      const payload = { ...data };
      if (!payload.assigned_to) payload.assigned_to = null;
      if (!payload.scheduled_at) payload.scheduled_at = null;

      if (task) {
        return housekeepingApi.updateTask(activeHotelId, task.id, payload);
      }
      return housekeepingApi.createTask(activeHotelId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['housekeeping', activeHotelId]);
      onClose();
    }
  });

  const rooms = roomsData?.data || [];
  const users = usersData?.data || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task ? 'Edit Housekeeping Task' : 'New Housekeeping Task'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit((data) => mutation.mutate(data))} isLoading={mutation.isPending}>
            {task ? 'Update Task' : 'Create Task'}
          </Button>
        </>
      }
    >
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Room</label>
          <select 
            {...register('room_id', { required: true })}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            <option value="">Select a Room</option>
            {rooms.map(r => (
              <option key={r.id} value={r.id}>{r.room_number} - {r.room_type?.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Assign To (Staff)</label>
          <select 
            {...register('assigned_to')}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            <option value="">Unassigned</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Status</label>
          <select 
            {...register('status')}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Scheduled Time (Optional)</label>
          <input 
            type="datetime-local" 
            {...register('scheduled_at')}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
      </form>
    </Modal>
  );
};

export default HousekeepingFormModal;
