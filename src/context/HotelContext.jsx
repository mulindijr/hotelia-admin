import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';

const HotelContext = createContext();

export const HotelProvider = ({ children }) => {
  const { user } = useAuth();
  const [hotels, setHotels] = useState([]);
  const [activeHotelId, setActiveHotelId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadHotels();
    } else {
      setHotels([]);
      setActiveHotelId(null);
      setIsLoading(false);
    }
  }, [user]);

  const loadHotels = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/hotels');
      const fetchedHotels = response.data?.data || [];
      setHotels(fetchedHotels);
      
      if (fetchedHotels.length > 0) {
        const stored = localStorage.getItem('active_hotel_id');
        if (stored && fetchedHotels.find(h => h.id === parseInt(stored))) {
          setActiveHotelId(parseInt(stored));
        } else {
          setActiveHotelId(fetchedHotels[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load hotels', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeHotel = (id) => {
    setActiveHotelId(id);
    localStorage.setItem('active_hotel_id', id);
  };

  const activeHotel = hotels.find((h) => h.id === activeHotelId) || null;

  return (
    <HotelContext.Provider value={{ hotels, activeHotel, activeHotelId, changeHotel, isLoading }}>
      {children}
    </HotelContext.Provider>
  );
};

export const useHotel = () => useContext(HotelContext);
