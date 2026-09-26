import React from 'react';
import { Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EmptyState = () => {
  const navigate = useNavigate();
  return (
    <div className="p-12 bg-white border border-zinc-200 rounded-xl flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
      <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-2">
        <Building2 className="w-8 h-8 text-zinc-400" />
      </div>
      <h2 className="text-xl font-bold text-zinc-900">Welcome to your new Workspace!</h2>
      <p className="text-zinc-500 max-w-md">
        Your company has been successfully registered. To start managing bookings and viewing this page, you need to add your first hotel property.
      </p>
      <div className="pt-4">
        <button 
          onClick={() => navigate('/hotels')}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-zinc-900 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 transition-colors"
        >
          Create Your First Hotel
        </button>
      </div>
    </div>
  );
};

export default EmptyState;
