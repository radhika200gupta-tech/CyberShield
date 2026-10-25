import { configureStore } from '@reduxjs/toolkit';
import sampleCasesReducer from './sampleCasesSlice';

// Central Redux store holding global state slices
export const store = configureStore({
  reducer: {
    sampleCases: sampleCasesReducer,
  },
});

export default store;
