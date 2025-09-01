// Dashboard API - 단일 파일 버전

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
    } catch { }
    throw new Error(msg);
  }
  const data = await res.json().catch(() => ({}));
  return unwrapTRPC(data);
}

// ============================================
// Dashboard API 서비스
// ============================================
export const dashboardAPI = {
  /**
   * 대시보드 목록 조회
   */
  async getAllDashboards(projectId, page = 0, limit = 50) {
    try {
      console.log('대시보드 목록 조회:', { projectId, page, limit });
      
      const data = await trpcGet('dashboard.allDashboards', {
        projectId,
        page,
        limit,
        orderBy: { column: 'updatedAt', order: 'DESC' }
      });

      console.log('대시보드 목록 응답:', data);

      return {
        success: true,
        data: data?.dashboards || [],
        totalCount: data?.totalCount || 0
      };
      
    } catch (error) {
      console.error('대시보드 목록 조회 실패:', error);
      
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  /**
   * 개별 대시보드 조회
   */
  async getDashboard(projectId, dashboardId) {
    try {
      console.log('대시보드 조회:', { projectId, dashboardId });
      
      const data = await trpcGet('dashboard.getDashboard', {
        projectId,
        dashboardId
      });

      return {
        success: true,
        data
      };
      
    } catch (error) {
      console.error('대시보드 조회 실패:', error);
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  },

  /**
   * 대시보드 생성
   */
  async createDashboard(projectId, name, description = '') {
    try {
      console.log('대시보드 생성:', { projectId, name, description });
      
      const data = await trpcPost('dashboard.createDashboard', {
        projectId,
        name: name.trim(),
        description: description.trim()
      });

      console.log('대시보드 생성 완료:', data);

      return {
        success: true,
        data
      };
      
    } catch (error) {
      console.error('대시보드 생성 실패:', error);
      
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * 대시보드 메타데이터 수정
   */
  async updateDashboard(projectId, dashboardId, name, description = '') {
    try {
      console.log('대시보드 수정:', { projectId, dashboardId, name, description });
      
      const data = await trpcPost('dashboard.updateDashboardMetadata', {
        projectId,
        dashboardId,
        name: name.trim(),
        description: description.trim()
      });

      return {
        success: true,
        data
      };
      
    } catch (error) {
      console.error('대시보드 수정 실패:', error);
      
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * 대시보드 복제
   */
  async cloneDashboard(projectId, dashboardId) {
    try {
      console.log('대시보드 복제:', { projectId, dashboardId });
      
      const data = await trpcPost('dashboard.cloneDashboard', {
        projectId,
        dashboardId
      });

      return {
        success: true,
        data
      };
      
    } catch (error) {
      console.error('대시보드 복제 실패:', error);
      
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * 대시보드 삭제
   */
  async deleteDashboard(projectId, dashboardId) {
    try {
      console.log('대시보드 삭제:', { projectId, dashboardId });
      
      await trpcPost('dashboard.delete', {
        projectId,
        dashboardId
      });

      return {
        success: true,
        message: '대시보드가 삭제되었습니다.'
      };
      
    } catch (error) {
      console.error('대시보드 삭제 실패:', error);
      
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * 대시보드 정의 업데이트 (위젯 배치 등) - DashboardDetail에서 필요
   */
  async updateDashboardDefinition(projectId, dashboardId, definition) {
    try {
      console.log('대시보드 정의 업데이트:', { projectId, dashboardId, definition });
      
      const data = await trpcPost('dashboard.updateDashboardDefinition', {
        projectId,
        dashboardId,
        definition
      });

      return {
        success: true,
        data
      };
      
    } catch (error) {
      console.error('대시보드 정의 업데이트 실패:', error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// ============================================
// Widget API 서비스 (차트 데이터 조회용만 유지)
// ============================================
export const widgetAPI = {
  /**
   * 대시보드 차트 데이터 조회
   */
  async getChartData(projectId, queryName, filter = {}) {
    try {
      console.log('차트 데이터 조회:', { projectId, queryName, filter });
      
      const data = await trpcGet('dashboard.chart', {
        projectId,
        queryName,
        filter
      });

      return {
        success: true,
        data
      };
      
    } catch (error) {
      console.error('차트 데이터 조회 실패:', error);
      
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  /**
   * 대시보드 쿼리 실행
   */
  async executeQuery(projectId, query) {
    try {
      console.log('쿼리 실행:', { projectId, query });
      
      const data = await trpcGet('dashboard.executeQuery', {
        projectId,
        query
      });

      return {
        success: true,
        data
      };
      
    } catch (error) {
      console.error('쿼리 실행 실패:', error);
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
};

// ============================================
// 유틸리티 함수
// ============================================
export const dashboardUtils = {
  /**
   * 날짜 포맷 함수
   */
  formatDate(dateString) {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  },

  /**
   * 대시보드 편집 가능 여부 확인
   */
  isDashboardEditable(dashboard) {
    return dashboard?.owner === 'PROJECT';
  },

  /**
   * 에러 메시지 정리
   */
  getErrorMessage(error) {
    if (typeof error === 'string') return error;
    return error?.message || '알 수 없는 오류가 발생했습니다.';
  }
};

// ============================================
// 통합 Export
// ============================================
export default {
  dashboardAPI,
  widgetAPI,
  dashboardUtils
};