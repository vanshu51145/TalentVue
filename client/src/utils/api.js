const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

export function getApiUrl(path) {
  return `${API_BASE}${path}`;
}

export async function apiFetch(
  path,
  options = {}
) {
  const {
    headers = {},
    body,
    method,
    auth = true,
    ...rest
  } = options;

  const requestMethod =
    method ||
    (body !== undefined
      ? "POST"
      : "GET");

  const requestHeaders = {
    ...headers,
  };

  let requestBody = body;

  if (
    body !== undefined &&
    !(body instanceof FormData) &&
    typeof body !== "string"
  ) {
    requestHeaders["Content-Type"] =
      "application/json";

    requestBody = JSON.stringify(body);
  }

  if (auth) {
    const token =
      localStorage.getItem(
        "talentVueToken"
      );

    if (token) {
      requestHeaders.Authorization =
        `Bearer ${token}`;
    }
  }

  let response;

  try {
    response = await fetch(
      getApiUrl(path),
      {
        ...rest,
        method: requestMethod,
        headers: requestHeaders,
        body: requestBody,
      }
    );
  } catch {
    throw new Error(
      "Unable to reach the server. Please make sure the backend is running."
    );
  }

  if (
    auth &&
    response.status === 401
  ) {
    localStorage.removeItem(
      "talentVueToken"
    );

    localStorage.removeItem(
      "talentVueCurrentUser"
    );
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}
