import React from 'react';
import Badge from '../common/Badge';

const statusConfig = {
  pending: { variant: 'warning', label: 'Pending' },
  confirmed: { variant: 'success', label: 'Confirmed' },
  checked_in: { variant: 'info', label: 'Checked In' },
  checked_out: { variant: 'default', label: 'Checked Out' },
  cancelled: { variant: 'danger', label: 'Cancelled' },
  no_show: { variant: 'danger', label: 'No Show' }
};

const BookingStatusBadge = ({ status }) => {
  const config = statusConfig[status] || { variant: 'default', label: status };
  
  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
};

export default BookingStatusBadge;
