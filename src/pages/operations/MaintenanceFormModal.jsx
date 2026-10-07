import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceApi } from '../../api/operations';
import { roomsApi } from '../../api/rooms';
import { useHotel } from '../../context/HotelContext';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';

const MaintenanceFormModal = ({ isOpen, onClose, request }) => {
  const { activeHotelId } = useHotel();
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      room_id: '',
      description: '',
      priority: 'medium',
      status: 'open'
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (request) {
        reset({
          room_id: request.room_id || '',
          description: request.description || '',
          priority: request.priority || 'medium',
          status: request.status || 'open'
        });
      } else {
        reset({
          room_id: '',
          description: '',
          priority: 'medium',
          status: 'open'
        });
      }
    }
  }, [isOpen, request, reset]);

  // Fetch Rooms for dropdown
  const { data: roomsData } = useQuery({
    queryKey: ['rooms', activeHotelId],
    queryFn: () => roomsApi.getRooms(activeHotelId, { perPage: 100 }),
    enabled: !!activeHotelId && isOpen,
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      if (request) {
        return maintenanceApi.updateRequest(activeHotelId, request.id, data);
      }
      return maintenanceApi.createRequest(activeHotelId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['maintenance', activeHotelId]);
      onClose();
    }
  });

  const rooms = roomsData?.data || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={request ? 'Edit Maintenance Request' : 'New Maintenance Request'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit((data) => mutation.mutate(data))} isLoading={mutation.isPending}>
            {request ? 'Update Request' : 'Create Request'}
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
          <label className="block text-sm font-medium text-zinc-700 mb-1">Description of Issue</label>
          <textarea 
            {...register('description', { required: true })}
            rows="3"
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
            placeholder="e.g. Air conditioning not cooling properly."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Priority</label>
          <select 
            {...register('priority')}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Status</label>
          <select 
            {...register('status')}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900"
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </form>
    </Modal>
  );
};

export default MaintenanceFormModal;
