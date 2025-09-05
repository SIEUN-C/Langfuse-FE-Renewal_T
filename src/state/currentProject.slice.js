// src/state/currentProject.slice.js
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
  id: readLS("projectId") || null,
  name: readLS("projectName") || null,
};

const currentProjectSlice = createSlice({
  name: "currentProject",
  initialState,
  reducers: {
    /** id와 name을 함께 설정 (Optimistic 반영) */
    setProject: (state, action) => {
      const { id = null, name = null } = action.payload || {};
      state.id = id;
      state.name = name;
      writeLS("projectId", id);
      writeLS("projectName", name);
    },
    /** 기존 호환: id만 갱신 */
    setCurrentProjectId: (state, action) => {
      const id = action.payload ?? null;
      state.id = id;
      writeLS("projectId", id);
      // name은 유지
    },
    clearProject: (state) => {
      state.id = null;
      state.name = null;
      writeLS("projectId", null);
      writeLS("projectName", null);
    },
    /** 로컬스토리지 복원 */
    hydrateFromStorage: (state) => {
      state.id = readLS("projectId") || null;
      state.name = readLS("projectName") || null;
    },
  },
});

export const {
  setProject,
  setCurrentProjectId,
  clearProject,
  hydrateFromStorage,
} = currentProjectSlice.actions;

export default currentProjectSlice.reducer;
