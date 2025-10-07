import {createSlice} from '@reduxjs/toolkit';
import {LoginWithPhoneSendPasswordApi} from '../api/auth';

const initialState = {
  error: false,
  loading: false,
  status: null,
};

const LoginWithPhoneReducer = createSlice({
  initialState,
  name: 'LoginWithPhoneReducer',
  extraReducers: builder => {
    builder.addCase(LoginWithPhoneSendPasswordApi.pending, (state, action) => {
      state.loading = true;
      state.loading = false;
    });
    builder.addCase(
      LoginWithPhoneSendPasswordApi.fulfilled,
      (state, action) => {
        state.status = action.payload;
        state.loading = false;
        state.error = false;
      },
    );
    builder.addCase(LoginWithPhoneSendPasswordApi.rejected, (state, action) => {
      state.loading = false;
      state.error = true;
    });
  },
});

export default LoginWithPhoneReducer.reducer;
