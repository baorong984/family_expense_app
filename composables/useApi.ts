import { ElMessage } from "element-plus";

// 全局维护进行中的请求
const pendingRequests = new Map<string, AbortController>();

/**
 * API 请求 composable
 * 生产环境通过 Capacitor server.url 从服务器加载页面，API 请求自动同源
 */
export const useApi = () => {
  const userStore = useUserStore();
  const config = useRuntimeConfig();
  const apiBase = config.public.apiBase as string;

  /**
   * 拼接完整的 API 请求地址
   * Capacitor server 模式下使用相对路径（同源），其他模式拼接完整地址
   */
  const resolve_url = (url: string): string => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    // 如果 apiBase 与当前页面同源，直接返回相对路径
    if (typeof window !== "undefined" && window.location.origin === apiBase) {
      return url;
    }
    return `${apiBase}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  /**
   * 统一请求方法
   */
  const request = async <T = any>(
    url: string,
    options: any = {},
  ): Promise<T> => {
    const fullUrl = resolve_url(url);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // 添加 token
    if (userStore.token) {
      headers.Authorization = `Bearer ${userStore.token}`;
    }

    const reqMethod = options.method || "GET";
    // 生成请求的唯一标识 (基于方法、URL和参数)
    const reqKey = `${reqMethod}:${fullUrl}?${JSON.stringify(options.params || options.body || {})}`;

    if (pendingRequests.has(reqKey)) {
      if (reqMethod === "GET") {
        pendingRequests.get(reqKey)?.abort("Duplicate GET request cancelled");
        pendingRequests.delete(reqKey);
      } else {
        return Promise.reject(new Error("请求处理中，请勿重复提交"));
      }
    }

    const controller = new AbortController();
    options.signal = controller.signal;
    pendingRequests.set(reqKey, controller);

    try {
      console.log("[API] 请求:", reqMethod, fullUrl);

      const response = await fetch(fullUrl, {
        method: reqMethod,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      // 检查 HTTP 状态码
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // 401 未授权处理
        if (response.status === 401) {
          userStore.token = "";
          userStore.user = null;
          userStore.clearStorage();

          if (typeof window !== "undefined") {
            ElMessage.error("登录已过期，请重新登录");
            navigateTo("/login", { replace: true });
          }
        }

        throw new Error(errorData.message || `请求失败 (${response.status})`);
      }

      const data = await response.json();
      pendingRequests.delete(reqKey);

      // 兼容服务端统一响应格式 { success, data, message, code }
      if (data.code && data.code !== 200) {
        throw new Error(data.message || "请求失败");
      }

      return data as T;
    } catch (error: any) {
      pendingRequests.delete(reqKey);

      if (
        error.name === "AbortError" ||
        error.message === "Duplicate GET request cancelled"
      ) {
        console.warn("Request cancelled:", reqKey);
        return Promise.reject(error);
      }

      if (error.name === "TypeError" || error.message.includes("Failed to fetch")) {
        throw new Error("网络连接失败，请检查网络设置");
      }

      throw error;
    }
  };

  return {
    get: <T = any>(url: string, options?: any) =>
      request<T>(url, { ...options, method: "GET" }),
    post: <T = any>(url: string, body?: any, options?: any) =>
      request<T>(url, { ...options, method: "POST", body }),
    put: <T = any>(url: string, body?: any, options?: any) =>
      request<T>(url, { ...options, method: "PUT", body }),
    delete: <T = any>(url: string, options?: any) =>
      request<T>(url, { ...options, method: "DELETE" }),
  };
};
