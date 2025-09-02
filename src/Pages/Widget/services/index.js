// src/Pages/Widget/services/index.js
import { PreviewAPI } from "./preview";
import { WidgetsAPI } from "./widgets";
import { FiltersAPI } from "./filters";

class WidgetAPI extends PreviewAPI {
  constructor() {
    super();
    this._widgets = new WidgetsAPI();
    this._filters = new FiltersAPI();
    console.log("WidgetAPI initialized");
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
