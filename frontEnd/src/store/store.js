// src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import simulationReducer from '../features/Simulation/simulationSlice';
import historyReducer from '../features/History/historySlice';

export default configureStore({
  reducer: {
    simulation: simulationReducer,
    history: historyReducer,
  },
});
