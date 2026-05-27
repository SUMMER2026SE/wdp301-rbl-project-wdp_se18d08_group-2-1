// src/hooks/usePhotographers.js
import { useState, useCallback } from "react";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3000/api";

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

  // Search & filter photographers
  const searchPhotographers = useCallback(async (filters) => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "") {
          if (Array.isArray(value)) {
            value.forEach((v) => queryParams.append(key, v));
          } else {
            queryParams.append(key, value);
          }
        }
      });

      const response = await fetch(`${API_BASE_URL}/photographers/search?${queryParams}`);
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
    searchPhotographers,
    getPhotographerDetail,
    getTopPhotographers,
    getStyles,
    getLocations,
  };
};

export default usePhotographers;
