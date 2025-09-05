// src/state/store.js
import { configureStore } from "@reduxjs/toolkit";
import currentProjectReducer from "./currentProject.slice";
import currentOrgReducer from "./currentOrg.slice";

export const store = configureStore({
  reducer: {
    currentProject: currentProjectReducer,
    currentOrg: currentOrgReducer,
  },
});
