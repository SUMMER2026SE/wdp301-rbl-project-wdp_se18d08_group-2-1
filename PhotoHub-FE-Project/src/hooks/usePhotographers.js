// src/hooks/usePhotographers.js
import { useState, useCallback } from "react";

const API_BASE_URL = process.env.REACT_APP_API_URL || "https://photo-hub-be-project.vercel.app/api";

export const usePhotographers = () => {
  const [photographers, setPhotographers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  const buildQuery = (params) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (Array.isArray(value)) {
        value.forEach((v) => queryParams.append(key, v));
      } else {
        queryParams.append(key, value);
      }
    });
    return queryParams.toString();
  };

  const hasFilterValues = (filters) => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === "page" || key === "limit") return false;
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null && value !== "";
    });
  };

  const listPhotographers = useCallback(async (options = {}) => {
    try {
      setLoading(true);
      setError(null);

      const query = buildQuery(options);
      const response = await fetch(`${API_BASE_URL}/photographers${query ? `?${query}` : ""}`);
      if (!response.ok) throw new Error("Failed to list photographers");

      const result = await response.json();

      // Kiểm tra cấu trúc phản hồi từ API
      if (result.success && result.data) {
        // Đảm bảo photographers là một mảng trước khi đưa vào state
        const photographerList = Array.isArray(result.data.data) ? result.data.data : [];
        setPhotographers(photographerList);
        setPagination(result.data.pagination || { page: 1, limit: 12, total: 0, totalPages: 0 });
      } else {
        setPhotographers([]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  // Search & filter photographers
  const searchPhotographers = useCallback(async (filters) => {
    try {
      setLoading(true);
      setError(null);

      const query = buildQuery(filters);
      const endpoint = hasFilterValues(filters) ? "search" : "";
      const response = await fetch(`${API_BASE_URL}/photographers${endpoint ? `/${endpoint}` : ""}${query ? `?${query}` : ""}`);
      if (!response.ok) throw new Error("Failed to search photographers");

      const data = await response.json();
      if (data.success) {
        setPhotographers(data.data?.data || []);
        setPagination(data.data?.pagination || {});
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get photographer detail
  const getPhotographerDetail = useCallback(async (photographerId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/photographers/${photographerId}`);
      if (!response.ok) throw new Error("Failed to get photographer detail");

      const data = await response.json();
      if (data.success) {
        return data.data;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get top photographers
  const getTopPhotographers = useCallback(async (limit = 6) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/photographers/top?limit=${limit}`);
      if (!response.ok) throw new Error("Failed to get top photographers");

      const data = await response.json();
      if (data.success) {
        setPhotographers(data.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get available filters
  const getStyles = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/photographers/styles`);
      if (!response.ok) throw new Error("Failed to get styles");
      const data = await response.json();
      return data.data || [];
    } catch (err) {
      console.error(err);
      return [];
    }
  }, []);

  const getCategories = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/photographers/categories`);
      if (!response.ok) throw new Error("Failed to get categories");
      const data = await response.json();
      return data.data || [];
    } catch (err) {
      console.error(err);
      return [];
    }
  }, []);

  const getLocations = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/photographers/locations`);
      if (!response.ok) throw new Error("Failed to get locations");
      const data = await response.json();
      return data.data || [];
    } catch (err) {
      console.error(err);
      return [];
    }
  }, []);

  return {
    photographers,
    setPhotographers,
    loading,
    error,
    pagination,
    listPhotographers,
    searchPhotographers,
    getPhotographerDetail,
    getTopPhotographers,
    getStyles,
    getCategories,
    getLocations
  };
};

export default usePhotographers;
