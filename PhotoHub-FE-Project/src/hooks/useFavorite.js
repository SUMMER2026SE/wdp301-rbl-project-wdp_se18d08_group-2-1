import { useState, useCallback, useEffect } from "react";
import { favoriteService } from "../services/favoriteService";

/**
 * useFavorite — Custom hook quản lý trạng thái yêu thích cho một photographer.
 *
 * @param {string} photographerId - ID của photographer
 * @param {boolean} initialFavorited - Trạng thái ban đầu (nếu đã biết từ API)
 */
export function useFavorite(photographerId, initialFavorited = false) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  const eventName = `favorite-change-${photographerId}`;

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.detail && typeof e.detail.isFavorited === 'boolean') {
        setIsFavorited(e.detail.isFavorited);
      }
    };

    window.addEventListener(eventName, handleStorageChange);
    return () => window.removeEventListener(eventName, handleStorageChange);
  }, [eventName]);

  const isLoggedIn = () => !!localStorage.getItem("token");

  const toggle = useCallback(async () => {
    if (!isLoggedIn()) {
      // Trả về flag để component cha hiện thông báo đăng nhập
      return { requireLogin: true };
    }

    setLoading(true);
    try {
      if (isFavorited) {
        const res = await favoriteService.removeFavorite(photographerId);
        if (res.success !== false) {
          setIsFavorited(false);
          window.dispatchEvent(new CustomEvent(eventName, { detail: { isFavorited: false } }));
          return { success: true, action: "removed" };
        }
        return { success: false, message: res.message };
      } else {
        const res = await favoriteService.addFavorite(photographerId);
        if (res.success !== false) {
          setIsFavorited(true);
          window.dispatchEvent(new CustomEvent(eventName, { detail: { isFavorited: true } }));
          return { success: true, action: "added" };
        }
        return { success: false, message: res.message };
      }
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [isFavorited, photographerId, eventName]);

  const checkStatus = useCallback(async () => {
    if (!isLoggedIn() || !photographerId) return;
    try {
      const res = await favoriteService.checkFavoriteStatus(photographerId);
      if (res.success !== false && res.data) {
        setIsFavorited(res.data.isFavorited);
      }
    } catch (_) {}
  }, [photographerId]);

  return { isFavorited, loading, toggle, checkStatus, setIsFavorited };
}
