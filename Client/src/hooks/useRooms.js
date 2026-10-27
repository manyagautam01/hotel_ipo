import { useCallback, useEffect, useState } from 'react';
import { roomApi, errorMessage } from '../services/api.js';

export default function useRooms(params) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const key = JSON.stringify(params || {});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await roomApi.list(JSON.parse(key));
      setRooms(data.rooms);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    load();
  }, [load]);

  return { rooms, loading, error, reload: load };
}
