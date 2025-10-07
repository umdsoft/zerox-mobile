import React, {useState, useEffect, useCallback} from 'react';
import axios from 'axios';
import {storage} from '../store/api/token/getToken';

export const useFetch = ({url, method}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState(false);
  const [shouldRefresh, onRefresh] = useState({});
  const ApiFetch = useCallback(async () => {
    const token = storage.getString('token');

    const headers = {
      'Content-Type': 'application/json',
      Connection: 'close',
      Authorization: `Bearer ${token}`,
    };
    try {
      setLoading(true);
      const {data, status} = await axios({
        headers: headers,
        url: url,
        method: `${method}`,
      });

      if (status === 200) {
        setData(data);
      }
    } catch (err) {
      setError(true);
    }
    setLoading(false);
  }, [method, url]);
  useEffect(() => {
    ApiFetch();
  }, [url, method, shouldRefresh, ApiFetch]);
  return {loading, error, data, onRefresh};
};
