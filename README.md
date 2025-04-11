# callAPI

A robust, feature-rich js utility for making API calls with support for error handling, request timeout, license validation, and debugging.

## Features

- ✅ TypeScript support with comprehensive type definitions
- ✅ Built-in error handling and custom error classes
- ✅ Request timeout support
- ✅ Optional license validation
- ✅ Detailed debugging options
- ✅ Flexible response handling

## Installation

```bash
npm install callapi
```

## Basic Usage

```typescript
import { callApi } from "call-api";

// Simple GET request
const fetchData = async () => {
  try {
    const response = await callApi({
      baseUrl: "https://api.example.com",
      path: "/users",
      method: "GET",
      queryParams: { page: 1, limit: 10 },
    });

    console.log(response);
  } catch (error) {
    console.error("Failed to fetch data:", error);
  }
};
```

## API Reference

### `callApi(params: ApiCallOptions): Promise<any>`

The main function to make API calls with various options.

#### Parameters

`params` - An object with the following properties:

| Property           | Type                                                             | Required | Default   | Description                              |
| ------------------ | ---------------------------------------------------------------- | -------- | --------- | ---------------------------------------- |
| `baseUrl`          | string                                                           | Yes      | -         | The base URL for API calls               |
| `path`             | string                                                           | Yes      | -         | The path to append to the base URL       |
| `method`           | HttpMethod                                                       | No       | 'GET'     | HTTP method to use                       |
| `headers`          | Record<string, string>                                           | No       | {}        | HTTP headers to include                  |
| `body`             | unknown                                                          | No       | undefined | Request body (automatically stringified) |
| `queryParams`      | Record<string, string \| number \| boolean \| null \| undefined> | No       | undefined | Query parameters to append to the URL    |
| `skipURIEncoding`  | boolean                                                          | No       | false     | Skip URI encoding of query parameters    |
| `debug`            | DebugOptions                                                     | No       | {}        | Debug options (see below)                |
| `responseHandlers` | ResponseHandlers                                                 | No       | {}        | Success and error handlers               |
| `validateLicense`  | CommonApiParams & ResponseHandlers                               | No       | undefined | License validation options               |
| `timeout`          | number                                                           | No       | 10000     | Request timeout in milliseconds          |

#### Debug Options

| Property      | Type    | Default | Description                     |
| ------------- | ------- | ------- | ------------------------------- |
| `logUrl`      | boolean | false   | Log the constructed URL         |
| `logRequest`  | boolean | false   | Log the request body            |
| `logResponse` | boolean | false   | Log the raw response            |
| `logData`     | boolean | false   | Log the processed response data |

#### Response Handlers

| Property    | Type                        | Description                       |
| ----------- | --------------------------- | --------------------------------- |
| `onSuccess` | (response: unknown) => void | Called on successful API response |
| `onError`   | (error: unknown) => void    | Called when an error occurs       |

### Error Classes

#### `ApiResponseError`

Thrown when the API returns an error status code.

```typescript
class ApiResponseError extends Error {
  statusCode: number;
  response?: unknown;
}
```

#### `NetworkError`

Thrown when a network-related error occurs.

```typescript
class NetworkError extends Error {}
```

#### `TimeoutError`

Thrown when a request exceeds the timeout duration.

```typescript
class TimeoutError extends Error {}
```

## Advanced Examples

### POST Request with Request Body

```typescript
const createUser = async (userData) => {
  try {
    const response = await callApi({
      baseUrl: "https://api.example.com",
      path: "/users",
      method: "POST",
      body: userData,
      headers: {
        Authorization: "Bearer token123",
      },
    });

    return response;
  } catch (error) {
    console.error("Failed to create user:", error);
    throw error;
  }
};
```

### With License Validation

```typescript
const fetchProtectedData = async () => {
  try {
    const response = await callApi({
      baseUrl: "https://api.example.com",
      path: "/protected-data",
      validateLicense: {
        path: "/validate-license",
        body: { licenseKey: "YOUR_LICENSE_KEY" },
        onError: (error) => console.error("License validation failed:", error),
      },
    });

    return response;
  } catch (error) {
    console.error("Failed to fetch protected data:", error);
    throw error;
  }
};
```

### With Debug Options

```typescript
const debugApiCall = async () => {
  try {
    const response = await callApi({
      baseUrl: "https://api.example.com",
      path: "/debug-endpoint",
      debug: {
        logUrl: true,
        logRequest: true,
        logResponse: true,
        logData: true,
      },
    });

    return response;
  } catch (error) {
    console.error("Debug API call failed:", error);
    throw error;
  }
};
```

### Using Response Handlers

```typescript
const handleApiCall = async () => {
  await callApi({
    baseUrl: "https://api.example.com",
    path: "/data",
    responseHandlers: {
      onSuccess: (data) => {
        console.log("Success:", data);
        // Process data further
      },
      onError: (error) => {
        console.error("Error occurred:", error);
        // Handle error, show notification, etc.
      },
    },
  });
};
```

## License

MIT
