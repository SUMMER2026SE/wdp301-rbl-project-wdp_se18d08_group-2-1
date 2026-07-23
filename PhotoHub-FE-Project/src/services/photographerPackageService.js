import axios from "axios";

const API = "https://wdp301-rbl-project-wdp-se18d08-group-2-1.onrender.com/api";
const BACKEND_ORIGIN = "https://wdp301-rbl-project-wdp-se18d08-group-2-1.onrender.com";

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

const normalizeImageUrls = (value) => {
  const raw = Array.isArray(value) ? value : value ? [value] : [];

  return raw
    .map((item) => {
      if (!item) return "";
      if (typeof item === "string") return item;
      return item.imageUrl || item.secure_url || item.url || "";
    })
    .map((url) => String(url || "").trim())
    .filter(Boolean)
    .filter((url, index, arr) => arr.indexOf(url) === index);
};

const resolveUploadUrl = (url) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${BACKEND_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
};

export const uploadImages = async (files, onProgress) => {
  const selectedFiles = Array.from(files || []);
  if (selectedFiles.length === 0) return [];

  const formData = new FormData();
  selectedFiles.forEach((file) => formData.append("images", file));

  const res = await axios.post(`${API}/upload/images`, formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    timeout: 10 * 60 * 1000,
    onUploadProgress: (event) => {
      if (typeof onProgress === "function" && event.total) {
        onProgress(Math.round((event.loaded * 100) / event.total));
      }
    },
  });

  const urls = normalizeImageUrls(res.data?.data || res.data?.urls || res.data).map(resolveUploadUrl);
  if (urls.length !== selectedFiles.length) {
    throw new Error("Upload did not return valid image URLs for all selected files");
  }

  return urls;
};

export const createPackage = async (payload) => {
  const res = await axios.post(`${API}/packages`, payload, getHeaders());
  return res.data;
};

export const getMyPackages = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.categoryIds?.length) params.append("categoryIds", filters.categoryIds.join(","));
  if (filters.styleTagIds?.length) params.append("styleTagIds", filters.styleTagIds.join(","));
  if (filters.packageType) params.append("packageType", filters.packageType);
  if (filters.isGroupPackage !== undefined) params.append("isGroupPackage", filters.isGroupPackage);

  const res = await axios.get(`${API}/packages/my?${params.toString()}`, getHeaders());
  return res.data;
};

export const getPackageDetail = async (packageId) => {
  const res = await axios.get(`${API}/packages/${packageId}`, getHeaders());
  return res.data;
};

export const updatePackage = async (packageId, payload) => {
  const res = await axios.put(`${API}/packages/${packageId}`, payload, getHeaders());
  return res.data;
};

export const toggleStatusPackage = async (packageId) => {
  const res = await axios.patch(`${API}/packages/${packageId}/toggle-status`, {}, getHeaders());
  return res.data;
};

export const softDeletePackage = async (packageId) => {
  const res = await axios.delete(`${API}/packages/${packageId}`, getHeaders());
  return res.data;
};

export const getPhotographerPackages = async (photographerId, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.categoryIds?.length) params.append("categoryIds", filters.categoryIds.join(","));
  if (filters.styleTagIds?.length) params.append("styleTagIds", filters.styleTagIds.join(","));
  if (filters.packageType) params.append("packageType", filters.packageType);

  const query = params.toString();
  const res = await axios.get(
    `${API}/packages/photographer/${photographerId}${query ? `?${query}` : ""}`,
    getHeaders()
  );
  return res.data;
};
