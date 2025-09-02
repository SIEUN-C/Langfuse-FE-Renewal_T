import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { compactNumberFormatter } from "../../utils/numbers";
import Tooltip from "./Tooltip";

// ✅ 아주 얇은 어댑터: [{ts, values:[{label, value}]}] → [{ts, count}]
function adaptWidgetToBars(raw = [], wantedLabel = "count") {
  return raw.map((d) => {
    const hit = Array.isArray(d.values)
      ? d.values.find((x) => x.label === wantedLabel)
      : null;
    return {
      ts: Number(d.ts), // x축은 number(ms) 유지
      count: hit?.value ?? 0, // y값은 평평한 키로
    };
  });
}

/**
 * 바 형태의 시계열 차트 컴포넌트 (스크린샷과 동일한 초록색 바 차트)
 * @param {Object} props
 * @param {string} props.className - CSS 클래스명
 * @param {Array} props.data - 차트 데이터 (BaseTimeSeriesChart와 동일한 형식)
 * @param {function} props.valueFormatter - 값 포맷터 함수
 */
const BarTimeSeriesChart = (props) => {
  const {
    className = "",
    data = [],
    valueFormatter = compactNumberFormatter,
  } = props;

  console.log("=== BarTimeSeriesChart Debug ===");
  console.log("Received props:", props);
  console.log("Data length:", data.length);
  console.log("First data item:", JSON.stringify(data[0], null, 2));
  console.log("data[0].ts:", data[0]?.ts);
  console.log("data[0].values:", data[0]?.values);

  // 안전한 데이터 검증 (BaseTimeSeriesChart와 동일)
  const safeData = useMemo(() => {
    if (!Array.isArray(data)) {
      console.warn("BarTimeSeriesChart: data가 배열이 아닙니다:", data);
      return [];
    }

    return data.filter((d) => {
      if (!d || typeof d.ts === "undefined") {
        console.warn("BarTimeSeriesChart: 잘못된 데이터 포인트 (ts 없음):", d);
        return false;
      }

      if (!Array.isArray(d.values)) {
        console.warn(
          "BarTimeSeriesChart: 잘못된 데이터 포인트 (values가 배열이 아님):",
          d
        );
        return false;
      }

      return true;
    });
  }, [data]);

  /**
   * 데이터를 Recharts 바 차트 형식으로 변환
   */
  const chartData = useMemo(() => {
    if (safeData.length === 0) return [];

    try {
      return safeData.map((item, index) => {
        // 안전한 날짜 변환
        let formattedDate;
        try {
          const date = new Date(item.ts);
          if (isNaN(date.getTime())) {
            formattedDate = `Day ${index + 1}`;
          } else {
            formattedDate = `${date.getMonth() + 1}/${date.getDate()}`;
          }
        } catch (e) {
          formattedDate = `Day ${index + 1}`;
        }

        // 값 추출 (첫 번째 값 사용)
        let value = 0;
        if (
          item.values &&
          Array.isArray(item.values) &&
          item.values.length > 0
        ) {
          value = item.values[0].value || 0;
        }

        return {
          date: formattedDate,
          value: value,
          // 원본 타임스탬프 보관 (정렬용)
          originalTs: item.ts,
        };
      });
    } catch (error) {
      console.error("BarTimeSeriesChart: 데이터 변환 에러:", error);
      return [];
    }
  }, [safeData]);

  // 시간순 정렬
  const sortedChartData = useMemo(() => {
    return [...chartData].sort((a, b) => a.originalTs - b.originalTs);
  }, [chartData]);

  // 동적 최대값 계산 (10% 버퍼 추가)
  const yAxisMax = useMemo(() => {
    if (sortedChartData.length === 0) return 100;

    const maxValue = Math.max(...sortedChartData.map((d) => d.value));
    if (maxValue <= 0) return 100;

    return Math.ceil(maxValue * 1.1);
  }, [sortedChartData]);

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
      <div
        style={{
          backgroundColor: "#1f2937",
          border: "1px solid #374151",
          borderRadius: "6px",
          padding: "8px 12px",
          fontSize: "0.875rem",
        }}
      >
        <div style={{ color: "#f9fafb", marginBottom: "4px" }}>{label}</div>
        <div style={{ color: "#34d399" }}>
          Count: {valueFormatter(payload[0].value)}
        </div>
      </div>
    );
  };

  // 로딩 상태
  if (safeData.length === 0) {
    return (
      <div className={className} style={{ padding: "20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "200px",
            color: "#6b7280",
            fontSize: "0.875rem",
          }}
        >
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={{ padding: "16px 0" }}>
      {sortedChartData.length === 0 ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "200px",
            color: "#6b7280",
            fontSize: "0.875rem",
          }}
        >
          Data processing error
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={sortedChartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#374151"
              opacity={0.3}
            />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              fontSize={12}
              angle={0}
              textAnchor="middle"
              height={60}
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              tickLine={{ stroke: "#9ca3af" }}
              axisLine={{ stroke: "#9ca3af" }}
              interval={0}
              minTickGap={5}
            />
            <YAxis
              stroke="#9ca3af"
              fontSize={11}
              tickFormatter={valueFormatter}
              domain={[0, yAxisMax]}
              axisLine={false}
              tickLine={false}
            />
            <RechartsTooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(55, 65, 81, 0.1)" }}
            />
            <Bar
              dataKey="value"
              fill="#34d399" // 스크린샷과 동일한 초록색
              radius={[2, 2, 0, 0]} // 상단 모서리만 둥글게
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* 개발용 디버그 정보 */}
      {import.meta.env.DEV && (
        <div
          style={{
            fontSize: "0.6rem",
            color: "#6b7280",
            fontFamily: "monospace",
            marginTop: "8px",
            textAlign: "center",
          }}
        >
          Data points: {sortedChartData.length} | Max: {yAxisMax}
        </div>
      )}
    </div>
  );
};

export default BarTimeSeriesChart;
