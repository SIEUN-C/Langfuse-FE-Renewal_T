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
  // ✅ projectId를 첫 인자로 받도록 수정
  async getWidgets(projectId, page = 1, pageSize = 50, order = "DESC") {
    const payload = {
      page: Math.max(0, Number(page) - 1),
      limit: Number(pageSize),
      orderBy: { column: "updatedAt", order },
      projectId: projectId || this.projectId, // URL/상위에서 받은 값 우선
    };

    try {
      if (DEBUG) console.log("[WidgetsAPI] 요청 시작:", payload);

      const data = await this.trpcGet("dashboardWidgets.all", payload);

      if (DEBUG) {
        console.log(
          "[WidgetsAPI] raw response:",
          JSON.stringify(data, null, 2)
        );
      }

      const items = extractItems(data);

      if (DEBUG) {
        console.log("[WidgetsAPI] extracted items:", items);
        console.log(
          "[WidgetsAPI] extracted count:",
          items.length,
          "first item keys:",
          items[0] ? Object.keys(items[0]) : "none"
        );
        if (items[0]) {
          console.log(
            "[WidgetsAPI] first item:",
            JSON.stringify(items[0], null, 2)
          );
        }
      }

      const base = data?.json || data || {};
      const total =
        base.totalCount ??
        base.total ??
        base.totalItems ??
        base.count ??
        items.length;

      const totalPages = Math.max(
        1,
        Math.ceil((Number(total || items.length) || 1) / (payload.limit || 1))
      );

      if (DEBUG) {
        console.log("[WidgetsAPI] 최종 결과:", {
          itemCount: items.length,
          total,
          totalPages,
          hasItems: items.length > 0,
        });
      }

      return { data: items, totalPages, totalCount: total };
    } catch (error) {
      console.error("Failed to fetch widgets:", error);
      if (error?.stack) console.error("Error stack:", error.stack);
      return { data: [], totalPages: 1, totalCount: 0, error: error.message };
    }
  }

  // ✅ (projectId, widgetId)로 시그니처 변경
  async deleteWidget(projectId, widgetId) {
    if (!widgetId) return { success: false, error: "widgetId 필요" };

    try {
      const result = await this.trpcPost("dashboardWidgets.delete", {
        projectId: projectId || this.projectId, // 전달
        widgetId, // 키 이름은 widgetId
      });

      if (DEBUG) console.log("[WidgetsAPI] delete result:", result);

      return { success: true, data: result };
    } catch (error) {
      console.error("Failed to delete widget:", error);
      return { success: false, error: error.message };
    }
  }

  // ✅ (projectId, payload)로 시그니처 변경
  async createWidget(projectId, payload) {
    try {
      const result = await this.trpcPost("dashboardWidgets.create", {
        projectId: projectId || this.projectId,
        ...payload,
      });

      if (DEBUG) console.log("[WidgetsAPI] create result:", result);

      return { success: true, data: result };
    } catch (error) {
      console.error("Failed to create widget:", error);
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

      if (data?.json) {
        console.log("[WidgetsAPI] json 내부 구조:");
        console.log("- Type:", typeof data.json);
        console.log("- Keys:", Object.keys(data.json));
        console.log("- JSON:", JSON.stringify(data.json, null, 2));
      }

      return data;
    } catch (error) {
      console.error("[WidgetsAPI] 디버깅 실패:", error);
      return null;
    }
  }
}

// ✅ 인스턴스를 생성하여 default export
const widgetServices = new WidgetsAPI();
export default widgetServices;