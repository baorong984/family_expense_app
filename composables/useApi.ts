import { ElMessage } from "element-plus";

// 全局维护进行中的请求
const pendingPromises = new Map<string, Promise<any>>();

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
    let fullUrl = resolve_url(url);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // 处理GET请求的查询参数，拼接到URL上
    if (options.params && typeof options.params === 'object') {
      const search_params = new URLSearchParams();
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== null && value !== undefined && value !== '') {
          search_params.append(key, String(value));
        }
      }
      const query_string = search_params.toString();
      if (query_string) {
        fullUrl += (fullUrl.includes('?') ? '&' : '?') + query_string;
      }
    }

    // 添加 token
    if (userStore.token) {
      headers.Authorization = `Bearer ${userStore.token}`;
    }

    const reqMethod = options.method || "GET";
    // 生成请求的唯一标识 (基于方法、URL和参数)
    const reqKey = `${reqMethod}:${fullUrl}`;

    if (pendingPromises.has(reqKey)) {
      if (reqMethod === "GET") {
        // GET 请求直接共享进行中的 Promise
        return pendingPromises.get(reqKey) as Promise<T>;
      } else {
        return Promise.reject(new Error("请求处理中，请勿重复提交"));
      }
    }

    const promise = (async () => {
      try {
        console.log("[API] 请求:", reqMethod, fullUrl);

        const response = await fetch(fullUrl, {
          method: reqMethod,
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: options.signal,
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

        const data = options.responseType === 'blob'
          ? await response.blob()
          : await response.json();

        // blob 响应直接返回
        if (options.responseType === 'blob') {
          return data as T;
        }

        // 兼容服务端统一响应格式 { success, data, message, code }
        if (data.code && data.code !== 200) {
          throw new Error(data.message || "请求失败");
        }

        return data as T;
      } catch (error: any) {
        if (error?.name === "AbortError") {
          console.warn("Request cancelled:", reqKey);
          return Promise.reject(error);
        }

        if (error?.name === "TypeError" || error?.message?.includes("Failed to fetch")) {
          throw new Error("网络连接失败，请检查网络设置");
        }

        throw error;
      } finally {
        pendingPromises.delete(reqKey);
      }
    })();

    pendingPromises.set(reqKey, promise);
    return promise;
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
