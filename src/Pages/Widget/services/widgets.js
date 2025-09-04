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
      
      // ✅ 간단한 데이터 정리
      items = items.map(widget => {
        // 이름 정리 (COUNT COUNT -> COUNT)
        const cleanName = widget.name ? widget.name.replace(/^(COUNT\s+)+/i, 'COUNT ') : widget.name;
        
        // 설명 기본값 설정
        let description = widget.description;
        if (!description || description.trim() === '') {
          if (cleanName && cleanName.toLowerCase().includes('count')) {
            description = 'Shows the count of Traces';
          } else {
            description = null; // null로 두면 UI에서 "No description" 표시
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

  // ✅ createWidget 메서드 수정 - 인자 순서와 처리 로직 개선
  async createWidget(projectId, payload) {
    try {
      // payload 유효성 검사
      if (!payload || typeof payload !== 'object') {
        throw new Error('Invalid payload: payload must be an object');
      }

      if (DEBUG) {
        console.log("[WidgetsAPI] createWidget 호출:", { projectId, payload });
      }

      // ✅ 위젯 데이터 구성 - Langfuse 구조에 맞게
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
        ...payload // 나머지 속성들 포함
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

  // ✅ 대시보드에 위젯 추가하는 메서드
  async addWidgetToDashboard(projectId, dashboardId, widgetId) {
    try {
      if (!dashboardId || !widgetId) {
        throw new Error('dashboardId and widgetId are required');
      }

      if (DEBUG) {
        console.log("[WidgetsAPI] 대시보드에 위젯 추가:", { projectId, dashboardId, widgetId });
      }

      const result = await this.trpcPost("dashboardWidgets.addToDashboard", {
        projectId: projectId || this.projectId,
        dashboardId,
        widgetId
      });

      if (DEBUG) {
        console.log("[WidgetsAPI] 대시보드 추가 결과:", result);
      }

      return { success: true, data: result };
    } catch (error) {
      console.error("[WidgetsAPI] 대시보드 위젯 추가 실패:", error);
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