import { createSlice } from '@reduxjs/toolkit';
import {
  HomeApi,
  getCreditorAndDebitorData,
  getCreditorDataAndDebitorData,
  getDevicesAction,
  getMe,
  getNotificationWithPage,
  getNotifications,
  onGetContract,
} from '../api/home';

type AppState = 'active' | 'background' | 'foreground';

const initialState = {
  error: false,
  loading: false,
  home: [],
  user: {},
  appState: 'active' as AppState,
  notification: {
    bild: [],
    news: [],
  },
  devices: [],
  isActive: false,
  contract: false,
  contractInfo: {},
  internet: true,
  update: false,
  expire: false,
  debitor: [],
  creditor: [],
  currect_device: {},
  usd: 1,
  fbNotificationId: '',
  pagination: {
    total: 0,
    current_page: 1,
    per_page: 10,
    totalPage: 0,
    loading: false,
  },
  contractLoading: false,
};

const HomeReducer = createSlice({
  initialState,
  name: 'HomeReducer',
  reducers: {
    startLoading(state) {
      state.loading = true;
    },
    stopLoading(state) {
      state.loading = false;
    },
    filter_notification(state, { payload }) {
      state.notification.bild = state.notification?.bild?.filter(
        item => item.id != payload,
      );
      state.pagination.total -= 1;
    },
    setFbNotificationId: (state, action) => {
      state.fbNotificationId = action.payload.fbNotificationId;
    },

    setEmptyUser: (state, action) => {
      state.user = {};
    },
    showModal: (state, action) => {
      state.isActive = action.payload.show;
    },
    setError: state => {
      state.error = false;
    },
    contractModalShow: (state, action) => {
      state.contract = action.payload.show;
    },
    checkingInternet: (state, action) => {
      state.internet = action.payload.internet;
    },
    checkExpire: (state, action) => {
      state.expire = action.payload.expire;
    },
    checkUpdate: (state, action) => {
      state.update = action.payload.update;
    },
    setNotification: (state, action) => {
      state.notification.bild = action.payload.notification;
    },
    setUsd: (state, action) => {
      state.usd = action.payload.usd;
    },
    setAppState: (state, action) => {
      state.appState = action.payload.appState;
    },
    setChangeEndDate: (state, action) => {
      state.contractInfo = {
        ...state.contractInfo,
        end_date: action.payload.end_date,
      };
    },
  },

  extraReducers: builder => {
    builder.addCase(HomeApi.pending, state => {
      state.loading = true;
      state.pagination.loading = true;
    });
    builder.addCase(HomeApi.fulfilled, (state, action) => {
      state.home = action.payload?.home;
      state.user = action.payload?.user;
      // let a = action.payload?.notification.filter(
      //   v => v.reciver === action.payload?.user.data.id,
      // );

      state.notification.bild = action.payload?.notification;

      state.pagination.current_page = action.payload?.pagination?.page;
      state.pagination.total = action.payload?.pagination?.total;
      state.pagination.per_page = action.payload?.pagination?.limit;
      state.pagination.totalPage = action.payload?.pagination?.totalPages;
      state.loading = false;
      state.pagination.loading = false;
    });
    builder.addCase(HomeApi.rejected, (state, action) => {
      state.error = action.payload;
      state.loading = false;
      state.pagination.loading = false;
    });
    builder.addCase(getMe.fulfilled, (state, action) => {
      state.user = action.payload?.user;
    });
    builder.addCase(getNotifications.fulfilled, (state, action) => {
      state.pagination.total = action?.payload?.pagination.total;
    });
    builder.addCase(getDevicesAction.fulfilled, (state, action) => {
      state.devices = action.payload?.data?.data;
    });
    builder.addCase(
      getCreditorDataAndDebitorData.fulfilled,
      (state, action) => {
        state.home = action.payload.home;
      },
    );
    builder.addCase(getCreditorAndDebitorData.fulfilled, (state, action) => {
      state.home = action.payload?.home;
      state.user = action.payload?.user;
    });
    builder.addCase(getNotificationWithPage.fulfilled, (state, action) => {
      state.notification.bild = action.payload?.notification.data;
    });

    builder.addCase(onGetContract.fulfilled, (state, action) => {
      state.contractInfo = action.payload?.contract?.data;
      state.contractLoading = false;
    });

    builder.addCase(onGetContract.pending, state => {
      state.contractLoading = true;
    });

    // builder.addCase(
    //   getCreditorDataAndDebitorData.fulfilled,
    //   (state, action) => {
    //     state.debitor = action.payload?.debitor;
    //     state.creditor = action.payload?.creditor;
    //   },
    // );
  },
});
export const {
  startLoading,
  stopLoading,
  filter_notification,
  showModal,
  contractModalShow,
  checkingInternet,
  checkUpdate,
  setNotification,
  setUsd,
  setAppState,
  setFbNotificationId,
  setEmptyUser,
  checkExpire,
  setChangeEndDate,
} = HomeReducer.actions;
export default HomeReducer.reducer;
