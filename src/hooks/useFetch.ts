import React, {useState, useEffect, useCallback} from 'react';
import axios from 'axios';
import {storage} from '../store/api/token/getToken';

export const useFetch = ({url, method}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState(false);
  const [shouldRefresh, onRefresh] = useState({});
  const ApiFetch = useCallback(
    async (signal?: AbortSignal) => {
      const token = storage.getString('token');

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };
      try {
        setLoading(true);
        setError(false);
        const {data, status} = await axios({
          headers: headers,
          url: url,
          method: `${method}`,
          signal,
        });

        if (status === 200) {
          setData(data);
        }
      } catch (err) {
        // Bekor qilingan so'rov (yangi qidiruv boshlandi) — bu xato EMAS, e'tiborsiz.
        if (axios.isCancel(err)) return;
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    [method, url],
  );
  useEffect(() => {
    // C-008: url/method o'zgarganda (har harfda) OLDINGI so'rovni bekor qilamiz —
    // eski (sekin) javob yangisining ustiga yozib qo'ymasin (race) + keraksiz yuk yo'q.
    const controller = new AbortController();
    ApiFetch(controller.signal);
    return () => controller.abort();
  }, [url, method, shouldRefresh, ApiFetch]);
  return {loading, error, data, onRefresh};
};
