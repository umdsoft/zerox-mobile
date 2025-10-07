import {createSlice} from '@reduxjs/toolkit';
import {UserSearch} from '../api/user';
const initialState = {
  error: {
    message: '',
    status: false,
  },
  loading: false,
  user: [],
};

const UserSearchReducer = createSlice({
  initialState,
  name: 'UserSearch',
  extraReducers: builder => {
    builder.addCase(UserSearch.pending, state => {
      state.loading = true;
    });
    builder.addCase(UserSearch.fulfilled, (state, action) => {
      state.user = action.payload.user;
      state.loading = false;
    });
    builder.addCase(UserSearch.rejected, (state, action) => {
      state.error.status = true;
      state.error.message = action.payload.message;
      state.loading = false;
    });
  },
  reducers: {
    defaultValue: (state, action) => {
      state.user = [];
      state.loading = false;
      state.error.status = false;
      state.error.message = '';
    },
  },
});
export const {defaultValue} = UserSearchReducer.actions;

export default UserSearchReducer.reducer;
