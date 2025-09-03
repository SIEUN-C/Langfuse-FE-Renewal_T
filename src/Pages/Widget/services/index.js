// src/Pages/Widget/services/index.js
import { PreviewAPI } from "./preview";
import { WidgetsAPI } from "./widgets";
import { FiltersAPI } from "./filters";

class WidgetAPI extends PreviewAPI {
  constructor(projectId = null) {
    super(projectId); // ✅ 부모 클래스에 projectId 전달
    this._widgets = new WidgetsAPI();
    this._filters = new FiltersAPI();
    console.log("WidgetAPI initialized with projectId:", projectId);
  }

  // ✅ projectId를 동적으로 설정하는 메서드
  setProjectId(projectId) {
    super.setProjectId(projectId); // 부모 클래스 메서드 호출
    // 필요시 _widgets, _filters에도 projectId 설정
  }

  // 목록/CRUD
  async getWidgets(...args) {
    return this._widgets.getWidgets(...args);
  }
  async deleteWidget(id) {
    return this._widgets.deleteWidget(id);
  }
  async createWidget(payload) {
    return this._widgets.createWidget(payload);
  }

  // 연결 체크
  async testConnection() {
    try {
      await this._widgets.getWidgets(1, 1, "DESC");
      return { success: true };
    } catch (e) {
      return { success: false, message: e?.message || String(e) };
    }
  }

  // 필터
  async getFilterColumns(view = "traces") {
    try {
      return await this._filters.getFilterColumns(view);
    } catch (error) {
      return this.getFallbackFilterColumns(view);
    }
  }
  async getFilterValues(params) {
    try {
      return await this._filters.getFilterValues(params);
    } catch {
      return { data: [] };
    }
  }
  async getOptions(view, options) {
    try {
      return await this._filters.getOptions(view, options);
    } catch {
      return this.getFallbackOptions(view);
    }
  }

  // 아래 fallback/preview 유틸은 PreviewAPI에 이미 구현됨
}

const api = new WidgetAPI();
export const widgetListAPI = new WidgetsAPI();
export const filtersAPI = new FiltersAPI();
export default api;
