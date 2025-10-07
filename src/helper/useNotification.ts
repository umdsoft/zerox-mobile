import {useEffect} from 'react';
import socketService from './socketService';
import {Store} from '../store/store/Store';
import {filter_notification} from '../store/reducers/HomeReducer';

const useNotification = () => {
  useEffect(() => {
    socketService.on('notification', data => {
      Store.dispatch(filter_notification(data.not));
    });
    return () => {
      socketService.off('notification');
    };
  }, []);
};
export default useNotification;
