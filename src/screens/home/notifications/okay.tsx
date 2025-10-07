import axios from 'axios';
import {storage} from '../../../store/api/token/getToken';
import {URL} from '../../constants';

// eslint-disable-next-line no-undef
export const okay = idx => {
  return new Promise(async (resolve, reject) => {
    const token = storage.getString('token');
    try {
      // eslint-disable-next-line no-undef
      const {data} = await axios.put(
        URL + `/notification/ok/${idx}`,
        {},
        {
          headers: {Authorization: `Bearer ${token}`, Connection: 'close'},
        },
      );
      resolve(data.success);
    } catch (error) {
      reject(error);
    }
  });
};
