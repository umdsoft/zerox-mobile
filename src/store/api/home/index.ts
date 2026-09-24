import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { successStatus, URL } from '../../../screens/constants';
import { storage } from '../token/getToken';
// SESSIYA IZOLYATSIYASI GUARD: so'rov boshlanganda joriy foydalanuvchi identifikatorini
// (user_id) suratga olamiz. Javob kelганда identifikator o'zgargan bo'lsa (logout yoki
// boshqa foydalanuvchi kirgan), bu javob ESKI foydalanuvchiники — uni Redux'ga YOZMAYMIZ.
// (Token-refresh'да user_id o'zgarmaydi, shuning uchun bu false-positive bermaydi.)
const isSameSession = (uidAtStart: string | undefined) =>
  storage.getString('user_id') === uidAtStart;

const HomeApi = createAsyncThunk(
  'get/home/user',
  async (state, { rejectWithValue }) => {
    const token = storage.getString('token');
    const uidAtStart = storage.getString('user_id');

    try {
      const [user_data, debitor, creditor, notification, analytics] =
        await axios.all([
          axios.get(URL + '/user/me', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          axios.get(URL + '/home/my?type=debitor', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          axios.get(URL + '/home/my?type=creditor', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          axios.get(
            URL + `/notification/me?page=${state.page || 1}&limit=500`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          ),
          // /home/analytics — bosh sahifa dashboard'i (moliyaviy sog'liq ball,
          // olingan/berilgan agregatlar, kontrakt statistikasi, ogohlantirishlar).
          // Web bilan bir manba. Xato bo'lsa butun home buzilmasin → catch(null).
          axios
            .get(URL + '/home/analytics', {
              headers: { Authorization: `Bearer ${token}` },
            })
            .catch(() => null),
        ]);

      // Sessiya guard — javob eski foydalanuvchiники bo'lsa qabul qilmaymiz.
      if (!isSameSession(uidAtStart)) {
        return rejectWithValue({ message: 'stale-session' });
      }
      if (
        user_data.status === successStatus &&
        creditor.status === successStatus &&
        debitor.status === successStatus &&
        notification.status
      ) {
        return {
          user: user_data.data,
          home: {
            debitor: debitor.data,
            creditor: creditor.data,
          },
          notification: notification.data?.data,
          pagination: notification.data?.pagination,
          analytics: analytics?.data?.data ?? null,
        };
      }
    } catch (error: any) {
      console.error({ 'Notification-Error-1': error.message });
      // error.response network-error'da undefined (ikkilamchi crash) → guard;
      // + return (oldin return yo'q edi → reject hech qachon ishlamasdi).
      return rejectWithValue(
        error?.response?.data ?? { message: error?.message ?? 'Network error' },
      );
    }
  },
);

const getCreditorAndDebitorData = createAsyncThunk(
  'get/creditor/debitor/user',
  async state => {
    const token = storage.getString('token');
    const uidAtStart = storage.getString('user_id');
    try {
      const [user, debitor, creditor] = await axios.all([
        axios.get(URL + '/user/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        axios.get(URL + '/home/my?type=debitor', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        axios.get(URL + '/home/my?type=creditor', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);
      // Sessiya guard — eski foydalanuvchi javobini yozmaymiz.
      if (!isSameSession(uidAtStart)) {
        return undefined;
      }
      return {
        user: user.data,
        home: {
          debitor: debitor.data,
          creditor: creditor.data,
        },
      };
    } catch (error) {
      console.error({ 'Notification-Error-11': error.message });
    }
  },
);

const getMe = createAsyncThunk('getme', async state => {
  const token = storage.getString('token');
  const uidAtStart = storage.getString('user_id');
  try {
    const { data } = await axios.get(URL + '/user/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // Sessiya guard — eski foydalanuvchi javobini yozmaymiz.
    if (!isSameSession(uidAtStart)) {
      return undefined;
    }
    return {
      user: data,
    };
  } catch (error) {
    console.error({ 'Notification-Error-2': error.message });
  }
});

const getNotifications = createAsyncThunk('notification', async state => {
  const token = storage.getString('token');
  try {
    const { data } = await axios.get(
      URL + `/notification/me?page=${state.page || 1}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return {
      pagination: data.pagination,
    };
  } catch (error) {
    console.error({ 'Notification-Error-3': error.message });
  }
});

const getVersionAction = createAsyncThunk('getVersion', async state => {
  const token = storage.getString('token');

  try {
    const { data } = await axios.get(URL + `/version/get?type=${state.type}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      data: data,
      error: null,
    };
  } catch (error) {
    console.error({ 'Notification-Error-4': error.message });
    throw error;
  }
});

const postDeviceIdAction = createAsyncThunk('postDeviceId', async state => {
  const token = storage.getString('token');

  try {
    const { data } = await axios.post(URL + '/user/active-device', state, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (data.success) {
      return {
        success: true,
        data: data,
      };
    }
  } catch (error) {
    console.error({ 'Notification-Error-5': error.message });
    throw error;
  }
});

const updateDeviceStatusAction = createAsyncThunk(
  'updateDeviceStatus',
  async state => {
    const token = storage.getString('token');
    try {
      const {} = await axios.put(
        URL + '/user/active-device',
        {
          status: state.status,
          device_id: state.device_id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
    } catch (error) {
      console.error({ 'Notification-Error-6': error.message });
      throw error;
    }
  },
);

const closeActiveDeviceAction = createAsyncThunk(
  'closeActiveDevice',
  async state => {
    const token = storage.getString('token');
    try {
      const { data } = await axios.delete(URL + '/user/close-device', {
        data: {
          device_id: state.device_id,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (data.success) {
        return {
          data: data,
          success: true,
        };
      }
    } catch (error) {
      console.error({ 'Notification-Error-7': error.message });
      throw error;
    }
  },
);

const getDevicesAction = createAsyncThunk('getDevicesAction', async () => {
  const token = storage.getString('token');

  try {
    const { data } = await axios.get(URL + '/user/devices', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (data.success) {
      return {
        data: data,
        success: true,
      };
    }
  } catch (error) {
    console.error({ 'Notification-Error-8': error.message });
    throw error;
  }
});

const onListTimePostAction = createAsyncThunk(
  'onListTimePostAction',
  async ({ device_id }) => {
    try {
      await axios.put(
        URL + '/user/last-time',
        {
          device_id,
        },
        {
          headers: {
            Authorization: `Bearer ${storage.getString('token')}`,
          },
        },
      );
      return {
        success: true,
      };
    } catch (error) {
      console.error({ 'Notification-Error-9': error.message });
      throw error;
    }
  },
);

const onDeleteDevices = createAsyncThunk('onDeleteDevices', async state => {
  const token = storage.getString('token');
  try {
    const { data } = await axios.delete(URL + '/user/close-device', {
      data: {
        device_ids: state.data,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (data?.success) {
      return {
        success: true,
      };
    } else {
      return {
        success: false,
      };
    }
  } catch (error) {
    console.error({ 'Notification-Error-10': error.message });
    throw error;
  }
});

const getCreditorDataAndDebitorData = createAsyncThunk(
  'get/creditor/debitor',
  async state => {
    const token = storage.getString('token');
    try {
      const [debitor, creditor] = await axios.all([
        axios.get(URL + '/home/my?type=debitor', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        axios.get(URL + '/home/my?type=creditor', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);
      return {
        home: {
          debitor: debitor.data,
          creditor: creditor.data,
        },
      };
    } catch (error) {
      console.error({ 'Notification-Error-11': error.message });
      throw error;
    }
  },
);

const getNotificationWithPage = createAsyncThunk(
  'getNotifcationWithPage',
  async state => {
    const token = storage.getString('token');
    const uidAtStart = storage.getString('user_id');
    try {
      const { data } = await axios.get(
        URL + `/notification/me?page=${state.page || 1}&limit=500`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // Sessiya guard — eski foydalanuvchi bildirishnomalarini yozmaymiz.
      if (!isSameSession(uidAtStart)) {
        return undefined;
      }

      return {
        notification: data,
      };
    } catch (error) {
      console.error({ 'Notification-Error-3': error.message });
    }
  },
);

const onPostDefaultLang = createAsyncThunk(
  'onPostDefaultLang',
  async ({ lang, id }) => {
    const token = storage.getString('token');
    try {
      const { data } = await axios.post(
        URL + `/user/edit-lang/${id}`,
        { lang },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return {
        success: data.success,
        data: data,
      };
    } catch (error) {
      console.error({ 'Notification-Error-12': error.message });
      throw error;
    }
  },
);

const onGetNews = createAsyncThunk('onGetNews', async () => {
  const token = storage.getString('token');
  const lang = storage.getString('lang') || 'uz';
  try {
    const { data } = await axios.get(URL + `/news/get?lang=${lang}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return {
      news: data.data,
    };
  } catch (error) {
    console.error({ 'Notification-Error-13': error.message });
    throw error;
  }
});

const onGetContract = createAsyncThunk('onGetContract', async ({ id }) => {
  const token = storage.getString('token');
  try {
    const { data } = await axios.get(URL + `/contract/by/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return {
      contract: data,
    };
  } catch (error) {
    console.error({ 'Notification-Error-14': error.message });
    throw error;
  }
});

export {
  HomeApi,
  onDeleteDevices,
  getMe,
  onGetNews,
  getNotificationWithPage,
  getNotifications,
  getVersionAction,
  postDeviceIdAction,
  getDevicesAction,
  updateDeviceStatusAction,
  closeActiveDeviceAction,
  onListTimePostAction,
  getCreditorDataAndDebitorData,
  getCreditorAndDebitorData,
  onPostDefaultLang,
  onGetContract,
};
