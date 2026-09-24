import { useHotel } from '../context/HotelContext';

export const useCurrency = () => {
  const { activeHotel } = useHotel();
  const currencyCode = activeHotel?.settings?.currency || 'KES';

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      return `${currencyCode} 0.00`;
    }
    return `${currencyCode} ${Number(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return { currencyCode, formatCurrency };
};
