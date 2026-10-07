import React, { useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon, Upload, Star, Trash2, X } from 'lucide-react';
import { roomsApi } from '../../api/rooms';
import { useHotel } from '../../context/HotelContext';
import Modal from '../common/Modal';
import Button from '../common/Button';

const RoomTypeGalleryModal = ({ isOpen, onClose, roomType }) => {
  const { activeHotelId } = useHotel();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ['roomTypeImages', activeHotelId, roomType?.id],
    queryFn: () => roomsApi.getRoomTypeImages(activeHotelId, roomType?.id),
    enabled: !!activeHotelId && !!roomType && isOpen,
  });

  const images = response?.data || [];

  const uploadMutation = useMutation({
    mutationFn: (formData) => roomsApi.uploadRoomTypeImage(activeHotelId, roomType?.id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['roomTypeImages', activeHotelId, roomType?.id]);
    },
  });

  const primaryMutation = useMutation({
    mutationFn: (imageId) => roomsApi.setPrimaryRoomTypeImage(activeHotelId, roomType?.id, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries(['roomTypeImages', activeHotelId, roomType?.id]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (imageId) => roomsApi.deleteRoomTypeImage(activeHotelId, roomType?.id, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries(['roomTypeImages', activeHotelId, roomType?.id]);
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('image', file);
    uploadMutation.mutate(formData);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={roomType ? `Gallery: ${roomType.name}` : 'Room Gallery'}
      size="lg"
      footer={
        <div className="flex justify-between w-full">
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              isLoading={uploadMutation.isPending}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Photo
            </Button>
          </div>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      }
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-12 px-4 border-2 border-dashed border-zinc-200 rounded-lg">
            <ImageIcon className="mx-auto h-12 w-12 text-zinc-300 mb-4" />
            <h3 className="text-sm font-medium text-zinc-900">No images</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Get started by uploading a photo of this room type.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {images.map((img) => (
              <div key={img.id} className="relative group rounded-lg overflow-hidden border border-zinc-200 aspect-[4/3]">
                <img
                  src={img.image_path}
                  alt="Room"
                  className="w-full h-full object-cover"
                />
                
                {img.is_primary && (
                  <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-semibold px-2 py-1 rounded shadow-sm flex items-center">
                    <Star className="w-3 h-3 mr-1 fill-current" /> Primary
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!img.is_primary && (
                    <button
                      onClick={() => primaryMutation.mutate(img.id)}
                      disabled={primaryMutation.isPending}
                      className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                      title="Set as Primary"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this image?')) {
                        deleteMutation.mutate(img.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-colors"
                    title="Delete Image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default RoomTypeGalleryModal;
