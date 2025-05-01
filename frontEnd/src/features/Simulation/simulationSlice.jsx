// src/features/Simulation/simulationSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { runSimulationAPI } from './simulationAPI';

export const runSimulation = createAsyncThunk(
  'simulation/runSimulation',
  async ({ symbol, episodes }) => {
    const response = await runSimulationAPI(symbol, episodes);
    return response;
  }
);

const simulationSlice = createSlice({
  name: 'simulation',
  initialState: {
    data: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(runSimulation.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(runSimulation.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(runSimulation.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export default simulationSlice.reducer;
