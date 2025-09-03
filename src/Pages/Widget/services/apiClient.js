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
    
    console.log("ApiClient initialized:", {
      baseURL: this.baseURL,
      isDEV: import.meta.env.DEV
    });
  }

  setProjectId(projectId) {
    this.projectId = projectId;
  }

  async trpcGet(endpoint, params = {}, opts = { useBasic: false }) {
    // baseURL이 빈 문자열이면 /api로 시작하도록 수정
    const url = this.baseURL ? `${this.baseURL}/api/trpc/${endpoint}` : `/api/trpc/${endpoint}`;
    const input = {
      json: params.projectId
        ? params
        : { ...params, projectId: this.projectId },
    };
    const query = new URLSearchParams({ input: JSON.stringify(input) });

    console.log("GET Request:", {
      baseURL: this.baseURL,
      finalURL: `${url}?${query.toString().substring(0, 100)}...`,
      endpoint,
    });

    const headers = { "Content-Type": "application/json" };

    if (this.publicKey && this.secretKey) {
      headers.Authorization = `Basic ${btoa(
        `${this.publicKey}:${this.secretKey}`
      )}`;
    }

    const res = await fetch(`${url}?${query}`, {
      method: "GET",
      headers,
      credentials: "include",
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
    // baseURL이 빈 문자열이면 /api로 시작하도록 수정
    const url = this.baseURL ? `${this.baseURL}/api/trpc/${endpoint}` : `/api/trpc/${endpoint}`;
    const headers = { "Content-Type": "application/json" };

    if (this.publicKey && this.secretKey) {
      headers.Authorization = `Basic ${btoa(
        `${this.publicKey}:${this.secretKey}`
      )}`;
    }

    const body = {
      json: { ...payload, projectId: payload.projectId || this.projectId },
    };

    console.log("POST Request:", {
      baseURL: this.baseURL,
      finalURL: url,
      endpoint,
      bodyKeys: Object.keys(body.json),
      hasAuth: !!headers.Authorization
    });

    const res = await fetch(url, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      let msg = `POST ${endpoint} failed (${res.status})`;
      try {
        const j = await res.json();
        console.error("tRPC POST error response:", j);
        // 실제 에러 메시지 추출 시도
        if (j?.error?.json?.message) {
          msg = j.error.json.message;
        } else if (j?.error?.message) {
          msg = j.error.message;
        }
      } catch {}
      throw new Error(msg);
    }

    const data = await res.json().catch(() => ({}));
    return unwrapTRPC(data);
  }
}