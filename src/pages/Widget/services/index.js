// src/Pages/Widget/services/index.js
import { PreviewAPI } from "./preview";
import { WidgetsAPI } from "./widgets";
import { FiltersAPI } from "./filters";
import { executeQuery } from "./metricsApi"; // 추가

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

  // executeQuery 메서드 추가
  async executeQuery(queryParams) {
    try {
      console.log("[WidgetAPI] executeQuery 호출:", queryParams);
      
      // metricsApi의 executeQuery 함수 호출
      const result = await executeQuery(queryParams);
      
      console.log("[WidgetAPI] 쿼리 실행 결과:", result);
      return result;
      
    } catch (error) {
      console.error("[WidgetAPI] executeQuery 실패:", error);
      return {
        success: false,
        error: error.message || 'Failed to execute query'
      };
    }
  }

  // 목록/CRUD
  async getWidgets(...args) {
    return this._widgets.getWidgets(...args);
  }

  async deleteWidget(widgetId) {
    return this._widgets.deleteWidget(this.projectId, widgetId);
  }

  // ✅ 새로 추가: 위젯 업데이트 메서드
  async updateWidget(payload) {
    try {
      console.log("[WidgetAPI] updateWidget 호출:", { 
        hasPayload: !!payload, 
        projectId: this.projectId 
      });

      // payload에 projectId 추가
      const widgetData = {
        ...payload,
        projectId: this.projectId
      };

      // 위젯 업데이트
      const updateResult = await this._widgets.updateWidget(this.projectId, widgetData);
      
      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to update widget');
      }

      console.log("[WidgetAPI] 위젯 업데이트 성공:", updateResult);

      return {
        success: true,
        data: updateResult.data
      };

    } catch (error) {
      console.error("[WidgetAPI] updateWidget 실패:", error);
      return {
        success: false,
        error: error.message || 'Failed to update widget'
      };
    }
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

  // ✅ 대시보드에 위젯 추가 메서드 (NewWidget에서 사용)
 async addWidgetToDashboard(projectId, dashboardId, widgetId) {
  try {
    if (!dashboardId || !widgetId) {
      throw new Error('dashboardId and widgetId are required');
    }

    console.log("[WidgetAPI] === 대시보드 위젯 추가 시작 ===");
    console.log("[WidgetAPI] projectId:", projectId);
    console.log("[WidgetAPI] dashboardId:", dashboardId);
    console.log("[WidgetAPI] widgetId:", widgetId);

    // 🔥 수정: _widgets.addWidgetToDashboard 메서드 사용
    const result = await this._widgets.addWidgetToDashboard(projectId, dashboardId, widgetId);
    
    if (result.success) {
      console.log("[WidgetAPI] 대시보드에 위젯 추가 성공");
      return result;
    } else {
      console.error("[WidgetAPI] 대시보드에 위젯 추가 실패:", result.error);
      return result;
    }
    
  } catch (error) {
    console.error("[WidgetAPI] === 대시보드 위젯 추가 실패 ===");
    console.error("[WidgetAPI] 에러:", error);
    return { success: false, error: error.message };
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

  // Fallback 메서드들 (기존 유지)
  getFallbackFilterColumns(view) {
    const commonColumns = [
      { column: "environment", type: "string", label: "Environment" },
      { column: "name", type: "string", label: "Name" },  
      { column: "userId", type: "string", label: "User ID" },
      { column: "sessionId", type: "string", label: "Session ID" },
      { column: "release", type: "string", label: "Release" },
      { column: "version", type: "string", label: "Version" },
      { column: "tags", type: "arrayOptions", label: "Tags" }
    ];

    const viewSpecificColumns = {
      traces: [
        ...commonColumns,
        { column: "traceName", type: "string", label: "Trace Name" }
      ],
      observations: [
        ...commonColumns,
        { column: "observationName", type: "string", label: "Observation Name" },
        { column: "type", type: "string", label: "Type" },
        { column: "providedModelName", type: "string", label: "Model Name" }
      ],
      "scores-numeric": [
        { column: "name", type: "string", label: "Score Name" },
        { column: "source", type: "string", label: "Source" },
        { column: "environment", type: "string", label: "Environment" },
        { column: "userId", type: "string", label: "User ID" },
        { column: "sessionId", type: "string", label: "Session ID" }
      ],
      "scores-categorical": [
        { column: "name", type: "string", label: "Score Name" },
        { column: "stringValue", type: "string", label: "Value" },
        { column: "source", type: "string", label: "Source" },
        { column: "environment", type: "string", label: "Environment" },
        { column: "userId", type: "string", label: "User ID" },
        { column: "sessionId", type: "string", label: "Session ID" }
      ]
    };

    return {
      success: true,
      data: viewSpecificColumns[view] || commonColumns
    };
  }

  getFallbackOptions(view) {
    return {
      success: true,
      data: {
        dimensions: this.getFallbackFilterColumns(view).data,
        measures: this.getAvailableMeasuresForView(view)
      }
    };
  }

  getAvailableMeasuresForView(view) {
    const measuresByView = {
      traces: [
        { value: "count", label: "Count" },
        { value: "observationsCount", label: "Observations Count" },
        { value: "scoresCount", label: "Scores Count" },
        { value: "latency", label: "Latency" },
        { value: "totalTokens", label: "Total Tokens" },
        { value: "totalCost", label: "Total Cost" }
      ],
      observations: [
        { value: "count", label: "Count" },
        { value: "latency", label: "Latency" },
        { value: "totalTokens", label: "Total Tokens" },
        { value: "totalCost", label: "Total Cost" },
        { value: "timeToFirstToken", label: "Time To First Token" },
        { value: "countScores", label: "Count Scores" }
      ],
      "scores-numeric": [
        { value: "count", label: "Count" },
        { value: "value", label: "Score Value" }
      ],
      "scores-categorical": [
        { value: "count", label: "Count" }
      ]
    };
    
    return measuresByView[view] || measuresByView.traces;
  }

  // 아래 fallback/preview 유틸은 PreviewAPI에 이미 구현됨
}

const api = new WidgetAPI();
export const widgetListAPI = new WidgetsAPI();
export const filtersAPI = new FiltersAPI();
export default api;