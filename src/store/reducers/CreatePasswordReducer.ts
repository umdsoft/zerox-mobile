import {createSlice} from '@reduxjs/toolkit';
import {CreatePasswordSendApi} from '../api/auth';

const initialState = {
  error: false,
  loading: false,
  status: null,
};

const CreatePasswordReducer = createSlice({
  initialState,
  name: 'CreatePasswordReducer',
  extraReducers: builder => {
    builder.addCase(CreatePasswordSendApi.pending, (state, action) => {
      state.loading = true;
    });
    builder.addCase(CreatePasswordSendApi.fulfilled, (state, action) => {
      state.status = action.payload;
      state.loading = false;
    });
    builder.addCase(CreatePasswordSendApi.rejected, (state, action) => {
      state.error = action.payload;
      state.loading = false;
    });
  },
});

export default CreatePasswordReducer.reducer;
