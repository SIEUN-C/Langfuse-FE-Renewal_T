// src/Pages/Widget/services/index.js
import { PreviewAPI } from "./preview";
import { WidgetsAPI } from "./widgets";
import { FiltersAPI } from "./filters";

class WidgetAPI extends PreviewAPI {
  constructor(projectId = null) {
    super(projectId); // ✅ 부모 클래스에 projectId 전달
    this._widgets = new WidgetsAPI(projectId); // ✅ projectId 전달
    this._filters = new FiltersAPI(projectId); // ✅ projectId 전달
    console.log("WidgetAPI initialized with projectId:", projectId);
  }

  // ✅ projectId를 동적으로 설정하는 메서드
  setProjectId(projectId) {
    super.setProjectId(projectId); // 부모 클래스 메서드 호출
    this._widgets.setProjectId(projectId);
    this._filters.setProjectId(projectId);
    console.log("WidgetAPI projectId updated:", projectId);
  }

  // 목록/CRUD
  async getWidgets(...args) {
    return this._widgets.getWidgets(...args);
  }

  async deleteWidget(widgetId) {
    return this._widgets.deleteWidget(this.projectId, widgetId);
  }

  // ✅ 위젯 생성 - 대시보드 추가 기능 포함
  async createWidget(payload, dashboardId = null) {
    try {
      console.log("[WidgetAPI] createWidget 호출:", { 
        hasPayload: !!payload, 
        dashboardId,
        projectId: this.projectId 
      });

      // payload에 projectId 추가
      const widgetData = {
        ...payload,
        projectId: this.projectId
      };

      // 1단계: 위젯 생성
      const createResult = await this._widgets.createWidget(this.projectId, widgetData);
      
      if (!createResult.success) {
        throw new Error(createResult.error || 'Failed to create widget');
      }

      console.log("[WidgetAPI] 위젯 생성 성공:", createResult);

      const createdWidget = createResult.data;
      const widgetId = createdWidget?.id || createdWidget?.widgetId;

      // 2단계: 대시보드에 추가 (dashboardId가 제공된 경우)
      if (dashboardId && widgetId) {
        console.log("[WidgetAPI] 대시보드에 위젯 추가 시작:", { dashboardId, widgetId });
        
        try {
          const addResult = await this._widgets.addWidgetToDashboard(this.projectId, dashboardId, widgetId);
          
          if (addResult.success) {
            console.log("[WidgetAPI] 대시보드 추가 성공");
            return {
              success: true,
              data: {
                widget: createdWidget,
                dashboard: addResult.data,
                widgetId,
                dashboardId
              }
            };
          } else {
            console.warn("[WidgetAPI] 대시보드 추가 실패:", addResult.error);
            return {
              success: true,
              warning: `Widget created but failed to add to dashboard: ${addResult.error}`,
              data: {
                widget: createdWidget,
                widgetId,
                dashboardId: null
              }
            };
          }
        } catch (dashboardError) {
          console.warn("[WidgetAPI] 대시보드 추가 중 예외:", dashboardError);
          return {
            success: true,
            warning: `Widget created but failed to add to dashboard: ${dashboardError.message}`,
            data: {
              widget: createdWidget,
              widgetId,
              dashboardId: null
            }
          };
        }
      }

      // 대시보드 추가 없이 위젯만 생성
      return {
        success: true,
        data: {
          widget: createdWidget,
          widgetId,
          dashboardId: null
        }
      };

    } catch (error) {
      console.error("[WidgetAPI] createWidget 실패:", error);
      return {
        success: false,
        error: error.message || 'Failed to create widget'
      };
    }
  }

  // ✅ 대시보드 관련 메서드들 추가
  async getAllDashboards(params = {}) {
    const payload = {
      page: 0,
      limit: 100,
      orderBy: { column: "updatedAt", order: "DESC" },
      ...params,
      projectId: this.projectId
    };

    try {
      const response = await this.trpcGet("dashboard.allDashboards", payload);
      return response;
    } catch (error) {
      console.error("[WidgetAPI] 대시보드 목록 조회 실패:", error);
      throw error;
    }
  }

  // 연결 체크
  async testConnection() {
    try {
      await this._widgets.getWidgets(this.projectId, 1, 1, "DESC");
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