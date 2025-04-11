export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "OPTIONS";

export interface CommonApiParams {
  path: string;
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  queryParams?: Record<string, string | number | boolean | null | undefined>;
  skipURIEncoding?: boolean;
}

interface ResponseHandlers {
  onSuccess?(response: unknown): void;
  onError?(error: unknown): void;
}

interface ApiCallOptions extends CommonApiParams {
  baseUrl: string;
  debug?: {
    logUrl?: boolean;
    logRequest?: boolean;
    logResponse?: boolean;
    logData?: boolean;
  };
  responseHandlers?: ResponseHandlers;
  validateLicense?: CommonApiParams & ResponseHandlers;
  timeout?: number;
}

// Custom Error Classes
class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

class ApiResponseError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public response?: unknown
  ) {
    super(message);
    this.name = "ApiResponseError";
  }
}

class TimeoutError extends Error {
  constructor(message: string = "Request timed out") {
    super(message);
    this.name = "TimeoutError";
  }
}

// Helper function to build URL with query parameters
function buildUrl(
  baseUrl: string,
  path: string,
  queryParams?: Record<string, string | number | boolean | null | undefined>,
  skipURIEncoding: boolean = false
): string {
  const url = new URL(path, baseUrl);

  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const encodedKey = skipURIEncoding ? key : encodeURIComponent(key);
        const encodedValue = skipURIEncoding
          ? String(value)
          : encodeURIComponent(String(value));
        url.searchParams.append(encodedKey, encodedValue);
      }
    });
  }

  return url.toString();
}

// Helper function to process response
async function processResponse(response: Response) {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }
    throw new ApiResponseError(
      `API request failed with status ${response.status}`,
      response.status,
      errorData
    );
  }

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

// Main API call function
async function callApi(params: ApiCallOptions): Promise<any> {
  const {
    baseUrl,
    path,
    method = "GET",
    headers = {},
    body,
    queryParams,
    skipURIEncoding = false,
    debug = {},
    responseHandlers = {},
    validateLicense,
    timeout = 10000,
  } = params;

  // License validation if required
  if (validateLicense) {
    try {
      const licenseUrl = buildUrl(
        baseUrl,
        validateLicense.path,
        validateLicense.queryParams,
        validateLicense.skipURIEncoding
      );

      debug.logUrl && console.debug("License validation URL:", licenseUrl);
      debug.logRequest &&
        console.debug("License validation request:", validateLicense.body);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const licenseResponse = await fetch(licenseUrl, {
        method: validateLicense.method || "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
          ...validateLicense.headers,
        },
        body: validateLicense.body
          ? JSON.stringify(validateLicense.body)
          : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const licenseData = await processResponse(licenseResponse);
      validateLicense.onSuccess?.(licenseData);
    } catch (error) {
      validateLicense.onError?.(error);
      throw error;
    }
  }

  // Main API call
  try {
    const url = buildUrl(baseUrl, path, queryParams, skipURIEncoding);
    debug.logUrl && console.debug("API URL:", url);
    debug.logRequest && console.debug("API Request Body:", body);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseData = await processResponse(response);
    debug.logResponse && console.debug("API Response:", response);
    debug.logData && console.debug("API Response Data:", responseData);

    responseHandlers.onSuccess?.(responseData);
    return responseData;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      const timeoutError = new TimeoutError();
      responseHandlers.onError?.(timeoutError);
      throw timeoutError;
    }

    responseHandlers.onError?.(error);
    throw error;
  }
}

export {
  callApi,
  ApiResponseError,
  NetworkError,
  TimeoutError,
  type ApiCallOptions,
  type ResponseHandlers,
};
