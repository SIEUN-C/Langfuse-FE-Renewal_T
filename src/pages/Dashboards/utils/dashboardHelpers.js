// 날짜 범위를 일수로 변환
export const getDateRangeDays = (range) => {
    const daysMap = {
      "Past 7 days": 7,
      "Past 30 days": 30,
      "Past 90 days": 90,
      "Past year": 365,
    };
    return daysMap[range] || 7;
  };
  
  // 쿼리 타입에 따른 집계 방식 결정
  export const getAggregationType = (queryType) => {
    switch (queryType) {
      case "count":
        return "count";
      case "timeseries":
        return "count";
      case "group-by":
        return "sum";
      case "percentile-timeseries":
        return "p95";
      case "avg-group":
        return "avg";
      case "max-group":
        return "max";
      default:
        return "count";
    }
  };
  
  // 컴포넌트에 따른 차트 설정 타입 결정
  export const getChartConfigType = (component) => {
    switch (component) {
      case "TotalMetric":
        return "NUMBER";
      case "BaseTimeSeriesChart":
        return "BAR_TIME_SERIES";
      case "TracesBarListChart":
        return "BAR_CHART";
      case "LatencyChart":
        return "LINE_TIME_SERIES";
      case "ModelUsageChart":
        return "BAR_CHART";
      case "UserChart":
        return "PIE_CHART";
      default:
        return "NUMBER";
    }
  };
  
  // 컴포넌트에 전달할 데이터 준비
  export const getComponentData = (widget, data) => {
    if (data.error) return null;
    if (data.isEmpty) return null;
    if (data.isLoading) return null;
  
    switch (widget.component) {
      case 'TotalMetric':
        return data.value !== undefined ? data.value : 0;
      
      case 'BaseTimeSeriesChart':
      case 'TracesBarListChart':
      case 'ModelUsageChart':
      case 'UserChart':
      case 'LatencyChart':
      case 'ModelCostTable':
        // 안전한 배열 반환 (빈 배열도 유효한 데이터로 처리)
        if (Array.isArray(data.chartData)) {
          return data.chartData;
        }
        // chartData가 없거나 배열이 아니면 빈 배열 반환
        return [];
      
      default:
        if (data.chartData !== undefined) return data.chartData;
        if (data.value !== undefined) return data.value;
        return null;
    }
  };
  
  // 개발 환경에서 API 상태 표시
  export const getStatusIndicator = (widget, data) => {
    const REAL_API_COMPONENTS = ["TotalMetric"]; // 실제 API 적용 컴포넌트
    const useRealAPI = REAL_API_COMPONENTS.includes(widget.component);
    
    if (!import.meta.env.DEV) return null;
    
    if (useRealAPI) {
      if (data.apiStatus === 'success') return '🟢 Real API';
      if (data.apiStatus === 'failed') return '🔴 API Failed';
      return '🟡 API Loading';
    } else {
      if (data.isEmpty) return '⚪ Empty';
      if (data.apiStatus === 'mock') return '🔵 Mock Data';
      return '⚪ Pending';
    }
  };
  
  // 날짜 포맷팅
  export const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };
  
  // 대시보드 편집 가능 여부 확인
  export const isDashboardEditable = (dashboard) => {
    if (!dashboard) return false;
    return dashboard.owner !== "LANGFUSE";
  };