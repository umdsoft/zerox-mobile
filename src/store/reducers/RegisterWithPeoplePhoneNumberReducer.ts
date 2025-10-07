import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {UserDataPostApi} from '../api/auth';

const initialState = {
  error: false,
  loading: false,
  status: null,
};

const RegisterWithPeoplePhoneNumberReducer = createSlice({
  initialState,
  name: 'RegisterWithPeoplePhoneNumberReducer',
  reducers: {
    setValueNull: (state, action) => {
      state.error = false;
      state.loading = false;
      state.status = null;
    },
  },
  extraReducers: builder => {
    builder.addCase(UserDataPostApi.pending, (state, action) => {
      state.loading = true;
    });
    builder.addCase(UserDataPostApi.fulfilled, (state, action) => {
      state.status = action.payload;
      state.loading = false;
    });
    builder.addCase(UserDataPostApi.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});
export const {setValueNull} = RegisterWithPeoplePhoneNumberReducer.actions;
export default RegisterWithPeoplePhoneNumberReducer.reducer;
