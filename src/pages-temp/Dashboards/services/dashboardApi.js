// src/Pages/Dashboards/services/dashboardApi.js

// ============================================
// tRPC 유틸리티 함수
// ============================================
function unwrapTRPC(json) {
  return json?.result?.data?.json ?? json?.result?.data ?? json;
}

async function trpcGet(path, inputObj) {
  const input = encodeURIComponent(JSON.stringify({ json: inputObj || {} }));
  const res = await fetch(`/api/trpc/${path}?input=${input}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`GET ${path} failed (${res.status})`);
  const data = await res.json();
  return unwrapTRPC(data);
}

async function trpcPost(path, bodyObj) {
  const res = await fetch(`/api/trpc/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ json: bodyObj || {} }),
  });
  if (!res.ok) {
    let msg = `POST ${path} failed (${res.status})`;
    try {
      const j = await res.json();
      msg = j?.error?.message || msg;
    } catch {}
    throw new Error(msg);
  }
  const data = await res.json().catch(() => ({}));
  return unwrapTRPC(data);
}

// ============================================
// Dashboard API 서비스
// ============================================

/**
 * 대시보드 관련 API 서비스
 * Langfuse tRPC API를 래핑하여 일관된 인터페이스 제공
 */
export const dashboardAPI = {
  /**
   * Trace 필터 옵션 조회
   * @param {string} projectId - 프로젝트 ID
   * @returns {Promise<Object>} { success: boolean, data: { name: [], tags: [] } }
   */
  async getTraceFilterOptions(projectId) {
    try {
      const data = await trpcGet('traces.filterOptions', { projectId });
      
      // API 응답을 UI에서 사용하기 쉬운 형태로 변환
      const processedData = {
        name: data?.name?.map(item => item.value || item) || [],
        tags: data?.tags?.map(item => item.value || item) || []
      };
      
      return {
        success: true,
        data: processedData
      };
    } catch (error) {
      console.error("Trace 필터 옵션 조회 실패:", error);
      
      return {
        success: false,
        error: error.message,
        data: { name: [], tags: [] }
      };
    }
  },

  /**
   * Environment 필터 옵션 조회
   * @param {string} projectId - 프로젝트 ID
   * @returns {Promise<Object>} { success: boolean, data: [] }
   */
  async getEnvironmentFilterOptions(projectId) {
    try {
      const data = await trpcGet('projects.environmentFilterOptions', { projectId });
      
      const environments = Array.isArray(data) 
        ? data.map(item => item.environment || item) 
        : [];
      
      return {
        success: true,
        data: environments
      };
    } catch (error) {
      console.error("Environment 필터 옵션 조회 실패:", error);
      
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  /**
   * 대시보드 목록 조회
   */
  async getAllDashboards(projectId, page = 0, limit = 50) {
    try {
      const data = await trpcGet("dashboard.allDashboards", {
        projectId,
        page,
        limit,
        orderBy: { column: "updatedAt", order: "DESC" },
      });

      return {
        success: true,
        data: data?.dashboards || [],
        totalCount: data?.totalCount || 0,
      };
    } catch (error) {
      console.error("대시보드 목록 조회 실패:", error);

      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  },

  /**
   * 개별 대시보드 조회
   */
  async getDashboard(projectId, dashboardId) {
    try {
      const data = await trpcGet("dashboard.getDashboard", {
        projectId,
        dashboardId,
      });

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("대시보드 조회 실패:", error);

      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  },

  /**
   * 대시보드 생성
   */
  async createDashboard(projectId, name, description = "") {
    try {
      const data = await trpcPost("dashboard.createDashboard", {
        projectId,
        name: name.trim(),
        description: description.trim(),
      });

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("대시보드 생성 실패:", error);

      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * 대시보드 메타데이터 수정
   */
  async updateDashboardMetadata(projectId, dashboardId, metadata) {
    try {
      const data = await trpcPost("dashboard.updateDashboardMetadata", {
        projectId,
        dashboardId,
        name: metadata.name.trim(),
        description: metadata.description.trim(),
      });

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("대시보드 메타데이터 수정 실패:", error);

      return {
        success: false,
        error: error.message,
      };
    }
  },

  // 중복 메서드 - updateDashboardMetadata와 동일한 기능
  // async updateDashboard(projectId, dashboardId, name, description = "") {
  //   try {
  //     const data = await trpcPost("dashboard.updateDashboardMetadata", {
  //       projectId,
  //       dashboardId,
  //       name: name.trim(),
  //       description: description.trim(),
  //     });

  //     return {
  //       success: true,
  //       data,
  //     };
  //   } catch (error) {
  //     console.error("대시보드 수정 실패:", error);

  //     return {
  //       success: false,
  //       error: error.message,
  //     };
  //   }
  // },

  /**
   * 대시보드 복제
   */
  async cloneDashboard(projectId, dashboardId) {
    try {
      const data = await trpcPost("dashboard.cloneDashboard", {
        projectId,
        dashboardId,
      });

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("대시보드 복제 실패:", error);

      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * 대시보드 삭제
   */
  async deleteDashboard(projectId, dashboardId) {
    try {
      await trpcPost("dashboard.delete", {
        projectId,
        dashboardId,
      });

      return {
        success: true,
        message: "대시보드가 삭제되었습니다.",
      };
    } catch (error) {
      console.error("대시보드 삭제 실패:", error);

      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * 대시보드 정의 업데이트 (위젯 배치 등)
   */
  async updateDashboardDefinition(projectId, dashboardId, definition) {
    try {
      const data = await trpcPost("dashboard.updateDashboardDefinition", {
        projectId,
        dashboardId,
        definition,
      });

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("대시보드 정의 업데이트 실패:", error);

      return {
        success: false,
        error: error.message,
      };
    }
  },
};

// ============================================
// Widget API 서비스
// ============================================

/**
 * 위젯 관련 API 서비스
 */
export const widgetAPI = {
  /**
   * 개별 위젯 조회 (DashboardWidget에서 사용)
   */
  async getWidget(projectId, widgetId) {
    try {
      const data = await trpcGet("dashboardWidgets.get", {
        widgetId,
        projectId,
      });

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("개별 위젯 조회 실패:", error);

      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  },

  /**
   * 쿼리 실행 (차트 데이터 조회)
   */
  async executeQuery(projectId, query) {
    try {
      const data = await trpcGet("dashboard.executeQuery", {
        projectId,
        query,
      });

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("쿼리 실행 실패:", error);

      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  },

  /**
   * 위젯 목록 조회 (전체)
   */
  async getAllWidgets(projectId, orderBy = { column: "updatedAt", order: "DESC" }) {
    try {
      const data = await trpcGet("dashboardWidgets.all", {
        projectId,
        orderBy,
      });

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error("위젯 목록 조회 실패:", error);

      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  },

  /**
   * 위젯 생성
   */
  async createWidget(projectId, widgetData) {
    try {
      const data = await trpcPost("dashboardWidgets.create", {
        projectId,
        ...widgetData,
      });

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("위젯 생성 실패:", error);

      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * 위젯을 다른 프로젝트로 복사
   */
  async copyWidgetToProject(projectId, widgetId, dashboardId, placementId) {
    try {
      const data = await trpcPost("dashboardWidgets.copyToProject", {
        projectId,
        widgetId,
        dashboardId,
        placementId,
      });

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("위젯 복사 실패:", error);

      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * 위젯 수정
   */
  async updateWidget(projectId, widgetId, widgetData) {
    try {
      const data = await trpcPost("dashboardWidgets.update", {
        projectId,
        widgetId,
        ...widgetData,
      });

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("위젯 수정 실패:", error);

      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * 위젯 삭제
   */
  async deleteWidget(projectId, widgetId) {
    try {
      await trpcPost("dashboardWidgets.delete", {
        projectId,
        widgetId,
      });

      return {
        success: true,
        message: "위젯이 삭제되었습니다.",
      };
    } catch (error) {
      console.error("위젯 삭제 실패:", error);

      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * 대시보드 차트 데이터 조회 (레거시 API)
   */
  async getChartData(projectId, queryName, filter = {}) {
    try {
      const data = await trpcGet("dashboard.chart", {
        projectId,
        queryName,
        filter,
      });

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("차트 데이터 조회 실패:", error);

      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  },

  /**
   * 스코어 히스토그램 데이터 조회
   */
  async getScoreHistogram(projectId, filter = {}) {
    try {
      const data = await trpcGet("dashboard.scoreHistogram", {
        projectId,
        filter,
      });

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("스코어 히스토그램 조회 실패:", error);

      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  },
};

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 대시보드 관련 유틸리티 함수들
 */
export const dashboardUtils = {
  /**
   * 날짜 포맷 함수
   */
  formatDate(dateString) {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return dateString;
    }
  },

  /**
   * 대시보드 편집 가능 여부 확인
   */
  isDashboardEditable(dashboard) {
    return dashboard?.owner === "PROJECT";
  },

  /**
   * 에러 메시지 정리
   */
  getErrorMessage(error) {
    if (typeof error === "string") return error;
    return error?.message || "알 수 없는 오류가 발생했습니다.";
  },
};

// ============================================
// 통합 Export
// ============================================
export default {
  dashboardAPI,
  widgetAPI,
  dashboardUtils,
};