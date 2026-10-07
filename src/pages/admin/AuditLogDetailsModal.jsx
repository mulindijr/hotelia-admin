import React from 'react';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';

const AuditLogDetailsModal = ({ isOpen, onClose, log }) => {
  if (!log) return null;

  const properties = log.properties || {};
  const hasChanges = properties.old && properties.attributes;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Audit Log Details"
      footer={<Button onClick={onClose}>Close</Button>}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-lg border border-zinc-200">
          <div>
            <p className="text-xs text-zinc-500 uppercase font-semibold">User</p>
            <p className="text-sm font-medium text-zinc-900">
              {log.causer ? `${log.causer.first_name} ${log.causer.last_name}` : 'System / Unknown'}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase font-semibold">Action</p>
            <p className="text-sm font-medium text-zinc-900 capitalize">
              {log.event} {log.log_name}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase font-semibold">Timestamp</p>
            <p className="text-sm font-medium text-zinc-900">
              {new Date(log.created_at).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase font-semibold">IP Address</p>
            <p className="text-sm font-medium text-zinc-900">
              {properties.ip_address || 'N/A'}
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-zinc-900 mb-2">Description</p>
          <p className="text-sm text-zinc-600 p-3 bg-zinc-50 rounded-lg border border-zinc-200">
            {log.description}
          </p>
        </div>

        {hasChanges && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-zinc-900">Data Changes</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-red-600 mb-1">Old Values</p>
                <pre className="text-xs bg-zinc-900 text-zinc-300 p-3 rounded-lg overflow-x-auto">
                  {JSON.stringify(properties.old, null, 2)}
                </pre>
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-600 mb-1">New Values</p>
                <pre className="text-xs bg-zinc-900 text-zinc-300 p-3 rounded-lg overflow-x-auto">
                  {JSON.stringify(properties.attributes, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        {!hasChanges && properties.attributes && (
          <div>
            <p className="text-sm font-medium text-zinc-900 mb-2">Payload Details</p>
            <pre className="text-xs bg-zinc-900 text-zinc-300 p-3 rounded-lg overflow-x-auto">
              {JSON.stringify(properties.attributes, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AuditLogDetailsModal;
