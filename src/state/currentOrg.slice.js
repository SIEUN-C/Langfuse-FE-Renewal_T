// src/state/currentOrg.slice.js
import { createSlice } from "@reduxjs/toolkit";

function readLS(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function writeLS(key, val) {
  try {
    if (val === null || val === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, val);
  } catch {}
}

const initialState = {
  id: readLS("orgId") || null,
  name: readLS("orgName") || null,
};

const slice = createSlice({
  name: "currentOrg",
  initialState,
  reducers: {
    setOrganization(state, action) {
      const { id = null, name = null } = action.payload || {};
      state.id = id;
      state.name = name;
      writeLS("orgId", id);
      writeLS("orgName", name);
    },
    clearOrganization(state) {
      state.id = null;
      state.name = null;
      writeLS("orgId", null);
      writeLS("orgName", null);
    },
    hydrateFromStorage(state) {
      state.id = readLS("orgId") || null;
      state.name = readLS("orgName") || null;
    },
  },
});

export const { setOrganization, clearOrganization, hydrateFromStorage } = slice.actions;
export default slice.reducer;
