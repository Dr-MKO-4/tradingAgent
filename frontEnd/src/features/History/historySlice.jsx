// src/features/History/historySlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchHistory } from './historyAPI';

export const loadHistory = createAsyncThunk('history/loadHistory', async () => {
  const response = await fetchHistory();
  return response;
});

const historySlice = createSlice({
  name: 'history',
  initialState: {
    data: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadHistory.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loadHistory.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(loadHistory.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export default historySlice.reducer;
