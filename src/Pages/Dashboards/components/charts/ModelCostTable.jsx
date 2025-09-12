// src/Pages/Dashboards/components/charts/ModelCostTable.jsx
import React, { useState, useEffect } from "react";
import RightAlignedCell from "./RightAlignedCell";
import LeftAlignedCell from "./LeftAlignedCell";
import { DashboardCard } from "../cards/DashboardCard";
import { DashboardTable } from "../cards/DashboardTable";
import { compactNumberFormatter } from "../../utils/numbers";
import TotalMetric from "./TotalMetric";
import { totalCostDashboardFormatted } from "../../utils/dashboard-utils";
import { truncate } from "../../utils/string";
import { widgetAPI } from "../../services/dashboardApi";
import { createTracesTimeFilter } from "../../utils/dashboard-utils";

// DocPopup 미니 컴포넌트 (ModelCostTable 전용)
const DocPopup = ({ description, href }) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleClick = (e) => {
    if (!href) return;
    e.preventDefault();
    e.stopPropagation();
    window.open(href, "_blank");
    console.log("DocPopup 링크 클릭:", href);
  };

  const InfoIcon = () => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "inline-block" }}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12,11 L12,16" />
      <circle cx="12" cy="8" r="1" />
    </svg>
  );

  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
        marginLeft: "4px",
        marginRight: "4px",
      }}
      onMouseEnter={() => {
        setIsVisible(true);
        console.log("DocPopup 열림:", description);
      }}
      onMouseLeave={() => setIsVisible(false)}
    >
      <div
        onClick={handleClick}
        style={{
          display: "inline-block",
          cursor: href ? "pointer" : "default",
          color: "#6b7280",
          verticalAlign: "middle",
        }}
      >
        <InfoIcon />
      </div>

      {isVisible && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginBottom: "8px",
            padding: "8px 12px",
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            fontSize: "12px",
            color: "#374151",
            whiteSpace: "pre-wrap",
            zIndex: 1000,
            minWidth: "200px",
            maxWidth: "300px",
          }}
        >
          {description}

          <div
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid white",
            }}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Generation 유사 타입들을 가져오는 함수
 */
function getGenerationLikeTypes() {
  return ["GENERATION", "COMPLETION", "LLM"];
}

/**
 * 모델별 비용 테이블 컴포넌트 - 원본 스타일 매칭
 */
const ModelCostTable = ({
  className,
  projectId,
  globalFilterState,
  fromTimestamp,
  toTimestamp,
  isLoading = false,
}) => {
  // API 상태 관리
  const [metricsData, setMetricsData] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // API 호출
  useEffect(() => {
    const fetchModelCostData = async () => {
      if (!projectId) return;
      if (!fromTimestamp || !toTimestamp) return;
      if (isLoading) return;

      setApiLoading(true);
      setApiError(null);

      try {
        const transformedFilters = createTracesTimeFilter(
          globalFilterState || []
        );

        const filtersWithType = [
          ...transformedFilters,
          {
            column: "type",
            operator: "any of",
            value: getGenerationLikeTypes(),
            type: "stringOptions",
          },
        ];

        const fromISO =
          fromTimestamp instanceof Date
            ? fromTimestamp.toISOString()
            : new Date(fromTimestamp).toISOString();
        const toISO =
          toTimestamp instanceof Date
            ? toTimestamp.toISOString()
            : new Date(toTimestamp).toISOString();

        const modelCostQuery = {
          view: "observations",
          dimensions: [{ field: "providedModelName" }],
          metrics: [
            { measure: "totalCost", aggregation: "sum" },
            { measure: "totalTokens", aggregation: "sum" },
          ],
          filters: filtersWithType,
          timeDimension: null,
          fromTimestamp: fromISO,
          toTimestamp: toISO,
          orderBy: null,
        };

        const result = await widgetAPI.executeQuery(projectId, modelCostQuery);

        if (result.success && result.data) {
          setMetricsData(result.data);
        } else {
          setApiError(result.error || "Unknown error");
        }
      } catch (error) {
        setApiError(error.message);
      } finally {
        setApiLoading(false);
      }
    };

    fetchModelCostData();
  }, [projectId, globalFilterState, fromTimestamp, toTimestamp, isLoading]);

  // 실제 데이터가 있으면 사용, 없으면 Mock 데이터 사용
  const actualData = metricsData || [
    {
      providedModelName: "gpt-3.5-turbo",
      sum_totalTokens: 28,
      sum_totalCost: 0.000026,
    },
    {
      providedModelName: "Qwen3-30B-A3B-Instruct-2507-UD...",
      sum_totalTokens: 60,
      sum_totalCost: 0.0,
    },
  ];

  // 총 비용 계산
  const totalTokenCost = actualData.reduce((acc, curr) => {
    const cost = curr.sum_totalCost || 0;
    return acc + (isNaN(cost) ? 0 : cost);
  }, 0);

  // 테이블 데이터 변환
  const tableData = actualData
    .filter((item) => item.providedModelName !== null)
    .map((item, i) => [
      <LeftAlignedCell key={`${i}-model`} title={item.providedModelName}>
        {truncate(item.providedModelName, 30)}
      </LeftAlignedCell>,
      <RightAlignedCell key={`${i}-tokens`}>
        {item.sum_totalTokens
          ? compactNumberFormatter(item.sum_totalTokens)
          : "0"}
      </RightAlignedCell>,
      <RightAlignedCell key={`${i}-cost`}>
        {item.sum_totalCost
          ? totalCostDashboardFormatted(item.sum_totalCost)
          : "$0"}
      </RightAlignedCell>,
    ]);

  const isCurrentlyLoading = isLoading || apiLoading;

  return (
    <DashboardCard
      className={className}
      title="Model costs"
      description={null}
      isLoading={isCurrentlyLoading}
    >
      <>
        {/* TotalMetric을 테이블 밖으로 분리 - 원본 스타일 */}
        <TotalMetric
          totalCount={totalCostDashboardFormatted(totalTokenCost)} // ← 이렇게 수정
          description={
            <span>
              Total cost
              <DocPopup
                description="Calculated multiplying the number of tokens with cost per token for each model."
                href="https://langfuse.com/docs/model-usage-and-cost"
              />
            </span>
          }
        />

        {/* 테이블 영역 */}
        <DashboardTable
          headers={[
            "Model",
            <RightAlignedCell key="tokens">Tokens</RightAlignedCell>,
            <RightAlignedCell key="cost">USD</RightAlignedCell>,
          ]}
          rows={tableData}
          isLoading={isCurrentlyLoading}
          collapse={{ collapsed: 5, expanded: 20 }}
          noDataProps={{
            description: apiError
              ? `API Error: ${apiError}`
              : "No model cost data available for the selected time range.",
            href: "https://langfuse.com/docs/model-usage-and-cost",
          }}
        >
          {/* DashboardTable의 children은 비움 */}
        </DashboardTable>

        {/* 에러 표시 */}
        {apiError && (
          <div
            style={{
              marginTop: "12px",
              padding: "8px",
              backgroundColor: "#7f1d1d",
              color: "#fca5a5",
              borderRadius: "4px",
              fontSize: "14px",
            }}
          >
            Error: {apiError}
          </div>
        )}
      </>
    </DashboardCard>
  );
};

export default ModelCostTable;
