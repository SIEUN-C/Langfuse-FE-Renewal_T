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
      projectId ||
      import.meta.env.VITE_LANGFUSE_PROJECT_ID ||
      "cmf3m55m70005s007mg3no204"; // 기본값

    // Vite 개발 서버에서는 프록시 사용하므로 baseURL 비움
    this.baseURL = "";

    this.publicKey = import.meta.env.VITE_LANGFUSE_PUBLIC_KEY || "";
    this.secretKey = import.meta.env.VITE_LANGFUSE_SECRET_KEY || "";

    console.log("ApiClient initialized:", {
      baseURL: this.baseURL,
      isDEV: import.meta.env.DEV,
      hasProjectId: !!this.projectId,
      hasAuth: !!(this.publicKey && this.secretKey),
      projectId: this.projectId,
    });
  }

  setProjectId(projectId) {
    this.projectId = projectId;
    console.log("ApiClient projectId updated:", projectId);
  }

  async trpcGet(endpoint, params = {}, opts = { useBasic: false }) {
    const url = `/api/trpc/${endpoint}`;

    // projectId 보장
    const finalParams = {
      ...params,
      projectId: params.projectId || this.projectId,
    };

    const input = { json: finalParams };
    const query = new URLSearchParams({ input: JSON.stringify(input) });

    console.log("GET Request Details:", {
      finalURL: `${url}?${query.toString().substring(0, 100)}...`,
      endpoint,
      projectId: finalParams.projectId,
      paramsKeys: Object.keys(finalParams),
      inputSize: JSON.stringify(input).length,
    });

    const headers = { "Content-Type": "application/json" };
    // 대시보드/위젯은 세션 쿠키 사용. 정말 필요한 호출만 opts.useBasic=true로 Basic 사용
    if (opts.useBasic && this.publicKey && this.secretKey) {
      headers.Authorization = `Basic ${btoa(
        `${this.publicKey}:${this.secretKey}`
      )}`;
    }

    try {
      const res = await fetch(`${url}?${query}`, {
        method: "GET",
        headers,
        credentials: "include",
      });

      console.log("GET Response Status:", {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        endpoint,
        url: res.url,
      });

      if (!res.ok) {
        let msg = `GET ${endpoint} failed (${res.status})`;
        try {
          const errorData = await res.text();
          console.error("tRPC GET error response:", errorData);
          try {
            const errorJson = JSON.parse(errorData);
            if (errorJson?.error?.json?.message) {
              msg = errorJson.error.json.message;
            } else if (errorJson?.error?.message) {
              msg = errorJson.error.message;
            } else if (errorJson?.message) {
              msg = errorJson.message;
            } else {
              msg += `: ${errorData}`;
            }
          } catch {
            msg += `: ${errorData}`;
          }
        } catch (textError) {
          console.error("Error parsing GET error response:", textError);
        }
        throw new Error(msg);
      }

      const data = await res.json();
      const unwrapped = unwrapTRPC(data);

      console.log("GET Response Data:", {
        endpoint,
        hasData: !!unwrapped,
        dataKeys:
          unwrapped && typeof unwrapped === "object"
            ? Object.keys(unwrapped)
            : [],
        dataType: typeof unwrapped,
      });

      return unwrapped;
    } catch (error) {
      console.error(`GET ${endpoint} network error:`, error);
      if (error.name === "TypeError" && String(error.message).includes("fetch")) {
        throw new Error(
          `Network error: Cannot connect to server. Check if Langfuse is running on localhost:3000`
        );
      }
      throw error;
    }
  }

  async trpcPost(endpoint, payload = {}, opts = { useBasic: false }) {
    const url = `/api/trpc/${endpoint}`;
    const headers = { "Content-Type": "application/json" };
    if (opts.useBasic && this.publicKey && this.secretKey) {
      headers.Authorization = `Basic ${btoa(
        `${this.publicKey}:${this.secretKey}`
      )}`;
    }

    const body = {
      json: {
        ...payload,
        projectId: payload.projectId || this.projectId,
      },
    };

    console.log("POST Request Details:", {
      finalURL: url,
      endpoint,
      payload: body.json,
      hasAuth: !!headers.Authorization,
      projectId: body.json.projectId,
      payloadSize: JSON.stringify(body).length,
    });

    try {
      const res = await fetch(url, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(body),
      });

      console.log("POST Response Status:", {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        endpoint,
        contentType: res.headers.get("content-type"),
      });

      if (!res.ok) {
        let msg = `POST ${endpoint} failed (${res.status})`;
        try {
          const errorData = await res.text();
          console.error("tRPC POST error response:", errorData);
          try {
            const errorJson = JSON.parse(errorData);
            if (errorJson?.error?.json?.message) {
              msg = errorJson.error.json.message;
            } else if (errorJson?.error?.message) {
              msg = errorJson.error.message;
            } else if (errorJson?.message) {
              msg = errorJson.message;
            } else {
              msg += `: ${errorData}`;
            }
          } catch {
            msg += `: ${errorData}`;
          }
        } catch (textError) {
          console.error("Error parsing POST error response:", textError);
          if (res.status === 0) msg += " (Network error - check your connection)";
          else if (res.status >= 500) msg += " (Server error - please try again later)";
        }
        throw new Error(msg);
      }

      const data = await res.json().catch((parseError) => {
        console.error("Error parsing POST success response:", parseError);
        return {};
      });

      const unwrapped = unwrapTRPC(data);

      console.log("POST Response Data:", {
        endpoint,
        hasData: !!unwrapped,
        dataKeys:
          unwrapped && typeof unwrapped === "object"
            ? Object.keys(unwrapped)
            : [],
        dataType: typeof unwrapped,
      });

      return unwrapped;
    } catch (error) {
      console.error(`POST ${endpoint} network error:`, error);
      if (error.name === "TypeError" && String(error.message).includes("fetch")) {
        throw new Error(
          `Network error: Cannot connect to server. Check if Langfuse is running on localhost:3000`
        );
      }
      throw error;
    }
  }

  // 연결 상태 확인
  async checkConnection() {
    try {
      const response = await fetch("/api/health", {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch (error) {
      console.error("Connection check failed:", error);
      return false;
    }
  }

  // 재시도 포함 POST
  async trpcPostWithRetry(endpoint, payload = {}, maxRetries = 2) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        console.log(`POST attempt ${attempt}/${maxRetries + 1} for ${endpoint}`);
        return await this.trpcPost(endpoint, payload);
      } catch (error) {
        lastError = error;
        console.error(`POST attempt ${attempt} failed:`, error.message);
        if (attempt < maxRetries + 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }
    throw lastError;
  }

  // 간단 연결 테스트
  async testConnection() {
    try {
      console.log("Testing API connection...");
      const testPayload = {
        page: 0,
        limit: 1,
        orderBy: { column: "updatedAt", order: "DESC" },
      };
      const result = await this.trpcGet("dashboardWidgets.all", testPayload);
      console.log("Connection test successful:", !!result);
      return true;
    } catch (error) {
      console.error("Connection test failed:", error.message);
      return false;
    }
  }
}
