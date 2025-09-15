// src/Pages/Tracing/ObservationDetailApi.jsx

import { trpcQuery } from '../services/trpc.client';



// 관측치 상세(입출력 포함)
export async function fetchObservationDetails({
  observationId,
  traceId,
  projectId,
  truncated,     // 옵션
}) {
  const payload = {
    observationId: String(observationId),
    traceId: String(traceId),
    projectId: String(projectId),
    ...(typeof truncated === 'boolean' ? { truncated } : {}),
  };
  return trpcQuery('observations.byId', payload);
}
