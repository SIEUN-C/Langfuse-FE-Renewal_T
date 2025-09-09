// src/Pages/Widget/services/widgets.js
import { ApiClient } from "./apiClient.js";

const DEBUG = import.meta.env.DEV;

function extractItems(d) {
  if (!d) return [];
  if (d.json) return extractItems(d.json);

  if (Array.isArray(d.widgets)) return d.widgets;
  if (Array.isArray(d.items)) return d.items;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d.edges))
    return d.edges.map((e) => e?.node).filter(Boolean);
  if (Array.isArray(d.rows)) return d.rows;
  if (d.data) {
    if (Array.isArray(d.data.widgets)) return d.data.widgets;
    return extractItems(d.data);
  }

  if (typeof d === "object" && d !== null) {
    const arr = Object.values(d).find((v) => Array.isArray(v));
    if (arr) return arr;
  }
  return [];
}

export class WidgetsAPI extends ApiClient {
  constructor(projectId = null) {
    super(projectId);
  }

  async getWidgets(projectId, page = 1, pageSize = 50, order = "DESC") {
    const payload = {
      page: Math.max(0, Number(page) - 1),
      limit: Number(pageSize),
      orderBy: { column: "updatedAt", order },
      projectId: projectId || this.projectId,
    };

    try {
      if (DEBUG) console.log("[WidgetsAPI] 요청 시작:", payload);

      const data = await this.trpcGet("dashboardWidgets.all", payload);

      if (DEBUG) {
        console.log("[WidgetsAPI] 원본 응답:", JSON.stringify(data, null, 2));
      }

      let items = extractItems(data);
      
      items = items.map(widget => {
        const cleanName = widget.name ? widget.name.replace(/^(COUNT\s+)+/i, 'COUNT ') : widget.name;
        
        let description = widget.description;
        if (!description || description.trim() === '') {
          if (cleanName && cleanName.toLowerCase().includes('count')) {
            description = 'Shows the count of Traces';
          } else {
            description = null;
          }
        }

        return {
          ...widget,
          name: cleanName,
          description: description
        };
      });

      if (DEBUG) {
        console.log("[WidgetsAPI] 정리된 아이템:", items);
        console.log("[WidgetsAPI] 첫 번째 아이템:", items[0]);
      }

      const base = data?.json || data || {};
      const total = base.totalCount ?? base.total ?? base.totalItems ?? base.count ?? items.length;
      const totalPages = Math.max(1, Math.ceil((Number(total || items.length) || 1) / (payload.limit || 1)));

      return { 
        data: items, 
        totalPages, 
        totalCount: total 
      };
    } catch (error) {
      console.error("위젯 가져오기 실패:", error);
      return { data: [], totalPages: 1, totalCount: 0, error: error.message };
    }
  }

  async deleteWidget(projectId, widgetId) {
    if (!widgetId) return { success: false, error: "widgetId 필요" };

    try {
      const result = await this.trpcPost("dashboardWidgets.delete", {
        projectId: projectId || this.projectId,
        widgetId,
      });

      if (DEBUG) console.log("[WidgetsAPI] 삭제 결과:", result);

      return { success: true, data: result };
    } catch (error) {
      console.error("위젯 삭제 실패:", error);
      return { success: false, error: error.message };
    }
  }

  // ✅ 새로 추가: 위젯 업데이트 메서드
  async updateWidget(projectId, payload) {
    try {
      if (!payload || typeof payload !== 'object') {
        throw new Error('Invalid payload: payload must be an object');
      }

      if (!payload.widgetId) {
        throw new Error('widgetId is required for update');
      }

      if (DEBUG) {
        console.log("[WidgetsAPI] updateWidget 호출:", { projectId, payload });
      }

      const widgetData = {
        projectId: projectId || this.projectId,
        widgetId: payload.widgetId,
        name: payload.name || "Updated Widget",
        description: payload.description || "",
        view: payload.view || "traces",
        chartType: payload.chartType || "LINE_TIME_SERIES",
        dimensions: payload.dimensions || [],
        metrics: payload.metrics || [{ measure: "count", agg: "count" }],
        filters: payload.filters || [],
        chartConfig: payload.chartConfig || { type: payload.chartType || "LINE_TIME_SERIES" },
        ...payload
      };

      if (DEBUG) {
        console.log("[WidgetsAPI] 전송할 위젯 업데이트 데이터:", widgetData);
      }

      const result = await this.trpcPost("dashboardWidgets.update", widgetData);

      if (DEBUG) {
        console.log("[WidgetsAPI] 위젯 업데이트 결과:", result);
      }

      return { success: true, data: result };
    } catch (error) {
      console.error("[WidgetsAPI] 위젯 업데이트 실패:", error);
      return { success: false, error: error.message };
    }
  }

  async createWidget(projectId, payload) {
    try {
      if (!payload || typeof payload !== 'object') {
        throw new Error('Invalid payload: payload must be an object');
      }

      if (DEBUG) {
        console.log("[WidgetsAPI] createWidget 호출:", { projectId, payload });
      }

      const widgetData = {
        projectId: projectId || this.projectId,
        name: payload.name || "New Widget",
        description: payload.description || "Shows the count of Traces",
        view: payload.view || "traces",
        chartType: payload.chartType || "LINE_TIME_SERIES",
        dimensions: payload.dimensions || [],
        metrics: payload.metrics || [{ measure: "count", agg: "count" }],
        filters: payload.filters || [],
        chartConfig: payload.chartConfig || { type: payload.chartType || "LINE_TIME_SERIES" },
        ...payload
      };

      if (DEBUG) {
        console.log("[WidgetsAPI] 전송할 위젯 데이터:", widgetData);
      }

      const result = await this.trpcPost("dashboardWidgets.create", widgetData);

      if (DEBUG) {
        console.log("[WidgetsAPI] 위젯 생성 결과:", result);
      }

      return { success: true, data: result };
    } catch (error) {
      console.error("[WidgetsAPI] 위젯 생성 실패:", error);
      return { success: false, error: error.message };
    }
  }

  async addWidgetToDashboard(projectId, dashboardId, widgetId) {
    try {
      if (!dashboardId || !widgetId) {
        throw new Error('dashboardId and widgetId are required');
      }

      if (DEBUG) {
        console.log("[WidgetsAPI] === 대시보드 위젯 추가 시작 ===");
        console.log("[WidgetsAPI] projectId:", projectId);
        console.log("[WidgetsAPI] dashboardId:", dashboardId);
        console.log("[WidgetsAPI] widgetId:", widgetId);
      }

      console.log("[WidgetsAPI] 1단계: 대시보드 조회");
      const dashboard = await this.trpcGet("dashboard.getDashboard", {
        projectId: projectId || this.projectId,
        dashboardId
      });

      if (!dashboard) {
        throw new Error('대시보드를 찾을 수 없습니다');
      }

      console.log("[WidgetsAPI] 현재 대시보드:", dashboard);

      const currentDefinition = dashboard.definition || { widgets: [] };
      console.log("[WidgetsAPI] 현재 대시보드 정의:", currentDefinition);

      const newWidget = {
        id: `widget-${Date.now()}`,
        widgetId: widgetId,
        x: 0,
        y: 0, 
        w: 6,
        h: 4,
      };

      const updatedDefinition = {
        ...currentDefinition,
        widgets: [...(currentDefinition.widgets || []), newWidget]
      };

      console.log("[WidgetsAPI] 업데이트된 정의:", updatedDefinition);

      console.log("[WidgetsAPI] 2단계: 대시보드 정의 업데이트");
      const result = await this.trpcPost("dashboard.updateDashboardDefinition", {
        projectId: projectId || this.projectId,
        dashboardId,
        definition: updatedDefinition
      });

      console.log("[WidgetsAPI] 대시보드 업데이트 결과:", result);

      return { success: true, data: result };
      
    } catch (error) {
      console.error("[WidgetsAPI] === 대시보드 위젯 추가 실패 ===");
      console.error("[WidgetsAPI] 에러:", error);
      return { success: false, error: error.message };
    }
  }

  async debugApiStructure() {
    try {
      const payload = {
        page: 0,
        limit: 1,
        orderBy: { column: "updatedAt", order: "DESC" },
        projectId: this.projectId,
      };

      const data = await this.trpcGet("dashboardWidgets.all", payload);

      console.log("[WidgetsAPI] 전체 응답 구조:");
      console.log("- Type:", typeof data);
      console.log("- Keys:", data ? Object.keys(data) : "null");
      console.log("- JSON:", JSON.stringify(data, null, 2));

      return data;
    } catch (error) {
      console.error("[WidgetsAPI] 디버깅 실패:", error);
      return null;
    }
  }
}