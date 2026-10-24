const TOKEN_KEY = "mino-tracking-token";

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const headers = options.headers ? { ...options.headers } : {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, { ...options, headers });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const message = data?.message || "Something went wrong. Please try again.";
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return data;
}

export const api = {
  login: (passkey) =>
    request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passkey }),
    }),

  getVideos: () => request("/videos"),

  createVideo: (formData) => request("/videos", { method: "POST", body: formData }),

  updateVideo: (id, formData) => request(`/videos/${id}`, { method: "PUT", body: formData }),

  togglePaid: (id, paid) =>
    request(`/videos/${id}/paid`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid }),
    }),

  deleteVideo: (id) => request(`/videos/${id}`, { method: "DELETE" }),

  getPdfs: () => request("/pdfs"),

  createPdf: (formData) => request("/pdfs", { method: "POST", body: formData }),

  updatePdf: (id, formData) => request(`/pdfs/${id}`, { method: "PUT", body: formData }),

  togglePdfPaid: (id, paid) =>
    request(`/pdfs/${id}/paid`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid }),
    }),

  deletePdf: (id) => request(`/pdfs/${id}`, { method: "DELETE" }),
};
