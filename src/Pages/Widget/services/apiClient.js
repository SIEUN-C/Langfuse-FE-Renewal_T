// src/Pages/Widget/services/apiClient.js
function unwrapTRPC(json) {
  if (!json) return json;
  if (json?.result?.data?.json != null) return json.result.data.json;
  if (json?.result?.data != null) return json.result.data;
  return json;
}

export class ApiClient {
  constructor(projectId = null) {
    this.projectId =
      projectId || import.meta.env.VITE_LANGFUSE_PROJECT_ID || "";

    // 개발 모드에서는 빈 문자열로 프록시 사용
    this.baseURL = "";

    this.publicKey = import.meta.env.VITE_LANGFUSE_PUBLIC_KEY || "";
    this.secretKey = import.meta.env.VITE_LANGFUSE_SECRET_KEY || "";
  }

  setProjectId(projectId) {
    this.projectId = projectId;
  }

  async trpcGet(endpoint, params = {}, opts = { useBasic: false }) {
    const url = `${this.baseURL}/api/trpc/${endpoint}`;
    const input = {
      json: params.projectId
        ? params
        : { ...params, projectId: this.projectId },
    };
    const query = new URLSearchParams({ input: JSON.stringify(input) });

    console.log("🔍 API Request Debug:", {
      baseURL: this.baseURL,
      isDEV: import.meta.env.DEV,
      fullURL: `${url}?${query}`,
      endpoint,
      projectId: this.projectId,
    });

    const headers = { "Content-Type": "application/json" };

    // 기본적으로 Basic 인증 사용 (세션이 없는 경우 대비)
    if (this.publicKey && this.secretKey) {
      headers.Authorization = `Basic ${btoa(
        `${this.publicKey}:${this.secretKey}`
      )}`;
    }

    const res = await fetch(`${url}?${query}`, {
      method: "GET",
      headers,
      credentials: "include", // 세션 쿠키 포함
    });

    if (!res.ok) {
      let msg = `GET ${endpoint} failed (${res.status})`;
      try {
        const j = await res.json();
        console.error("tRPC GET error response:", j);
        msg = j?.error?.message || msg;
      } catch {}
      throw new Error(msg);
    }

    const data = await res.json();
    return unwrapTRPC(data);
  }

  async trpcPost(endpoint, payload = {}, opts = { useBasic: false }) {
    const url = `${this.baseURL}/api/trpc/${endpoint}`;
    const headers = { "Content-Type": "application/json" };

    // ✅ 기본적으로 Basic 인증 사용
    if (this.publicKey && this.secretKey) {
      headers.Authorization = `Basic ${btoa(
        `${this.publicKey}:${this.secretKey}`
      )}`;
    }

    console.log("tRPC POST request:", {
      url,
      headers: {
        ...headers,
        Authorization: headers.Authorization ? "[REDACTED]" : "none",
      },
      payload: { ...payload, projectId: payload.projectId || this.projectId },
    });

    const res = await fetch(url, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({
        json: { ...payload, projectId: payload.projectId || this.projectId },
      }),
    });

    if (!res.ok) {
      let msg = `POST ${endpoint} failed (${res.status})`;
      try {
        const j = await res.json();
        console.error("tRPC POST error response:", j);
        msg = j?.error?.message || msg;
      } catch {}
      throw new Error(msg);
    }

    const data = await res.json().catch(() => ({}));
    return unwrapTRPC(data);
  }
}
