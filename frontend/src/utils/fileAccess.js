import API from "../api/axiosConfig";

export function getDirectFileUrl(file) {
  return file?.fileUrl || null;
}

export function triggerDownload(url, fileName) {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName || "file";
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function openInNewTab(url) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export async function fetchDirectFileUrl(fileId, kind = "preview") {
  const endpoint = kind === "download" ? `/files/download-url/${fileId}` : `/files/preview-url/${fileId}`;
  const response = await API.get(endpoint);
  return response.data.fileUrl;
}
