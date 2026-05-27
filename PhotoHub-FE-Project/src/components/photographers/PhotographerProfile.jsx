// src/components/photographers/PhotographerProfile.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import usePhotographers from "../../hooks/usePhotographers";
import {
  Star,
  MapPin,
  Award,
  BookOpen,
  Mail,
  Phone,
  Loader,
  AlertCircle,
  Facebook,
  Instagram,
  Globe,
  CheckCircle,
} from "lucide-react";

const PhotographerProfile = ({ language = "en" }) => {
  const { id } = useParams();
  const { getPhotographerDetail, loading, error } = usePhotographers();
  const [photographer, setPhotographer] = useState(null);

  const labels = {
    en: {
      profile: "Photographer Profile",
      loading: "Loading photographer profile...",
      notFound: "Photographer not found",
      error: "Error loading profile",
      about: "About",
      styles: "Photography Styles",
      equipment: "Equipment",
      experience: "Experience",
      completedBookings: "Completed Bookings",
      rating: "Rating",
      reviews: "reviews",
      years: "years",
      socialLinks: "Social Links",
      bookNow: "Book Now",
      contact: "Contact",
      availability: "Availability",
      available: "Available",
      unavailable: "Unavailable",
      verified: "Verified",
      unverified: "Unverified",
      pending: "Pending Verification",
      hourlyRate: "Hourly Rate",
    },
    vi: {
      profile: "Hồ Sơ Nhiếp Ảnh Gia",
      loading: "Đang tải hồ sơ...",
      notFound: "Không tìm thấy nhiếp ảnh gia",
      error: "Lỗi khi tải hồ sơ",
      about: "Giới Thiệu",
      styles: "Phong Cách Chụp",
      equipment: "Thiết Bị",
      experience: "Kinh Nghiệm",
      completedBookings: "Lịch Chụp Hoàn Thành",
      rating: "Đánh Giá",
      reviews: "đánh giá",
      years: "năm",
      socialLinks: "Liên Kết Xã Hội",
      bookNow: "Đặt Ngay",
      contact: "Liên Hệ",
      availability: "Trạng Thái",
      available: "Sẵn Sàng",
      unavailable: "Không Sẵn Sàng",
      verified: "Đã Xác Minh",
      unverified: "Chưa Xác Minh",
      pending: "Đang Xác Minh",
      hourlyRate: "Giá / Giờ",
    },
  };

  const t = labels[language] || labels.en;

  useEffect(() => {
    if (id) {
      const loadPhotographer = async () => {
        const data = await getPhotographerDetail(id);
        setPhotographer(data);
      };
      loadPhotographer();
    }
  }, [id, getPhotographerDetail]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  if (error || !photographer) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg bg-red-50 py-12 dark:bg-red-900/20">
        <AlertCircle size={48} className="mb-4 text-red-500" />
        <h2 className="mb-2 text-2xl font-bold text-red-700 dark:text-red-400">
          {error ? t.error : t.notFound}
        </h2>
        <p className="text-red-600 dark:text-red-300">{error}</p>
      </div>
    );
  }

  const {
    user,
    displayName,
    location,
    experienceYears,
    equipment,
    bio,
    styles,
    socialLinks,
    averageRating,
    completedBookings,
    totalReviews,
    verificationStatus,
    isAvailable,
    hourlyRate,
  } = photographer;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-800">
        <div className="relative h-64 w-full bg-gradient-to-br from-blue-400 to-purple-500">
          {user?.avatar && (
            <img
              src={user.avatar}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          )}
        </div>

        {/* Info Card */}
        <div className="relative -mt-16 px-6 pb-6">
          <div className="mb-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {displayName}
                </h1>
                {user?.email && (
                  <p className="text-gray-600 dark:text-gray-300">{user.email}</p>
                )}
              </div>

              {/* Availability Badge */}
              <div
                className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium ${
                  isAvailable
                    ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                <CheckCircle size={18} />
                {isAvailable ? t.available : t.unavailable}
              </div>
            </div>

            {/* Verification Badge */}
            <div className="flex flex-wrap gap-2">
              {verificationStatus === "VERIFIED" && (
                <span className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                  <CheckCircle size={14} />
                  {t.verified}
                </span>
              )}
              {verificationStatus === "PENDING" && (
                <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                  {t.pending}
                </span>
              )}
              {verificationStatus === "UNVERIFIED" && (
                <span className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                  {t.unverified}
                </span>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {/* Rating */}
            <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
              <div className="flex items-center gap-2">
                <Star size={18} className="text-amber-500" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {averageRating?.toFixed(1) || "0"}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {totalReviews || 0} {t.reviews}
              </p>
            </div>

            {/* Experience */}
            <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-green-600" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {experienceYears || "0"}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {t.years}
              </p>
            </div>

            {/* Bookings */}
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-blue-600" />
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {completedBookings || "0"}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {t.completedBookings}
              </p>
            </div>

            {/* Price */}
            {hourlyRate && (
              <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${hourlyRate}
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {t.hourlyRate}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="space-y-6 lg:col-span-2">
          {/* About */}
          {bio && (
            <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
              <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
                {t.about}
              </h2>
              <p className="leading-relaxed text-gray-600 dark:text-gray-300">
                {bio}
              </p>
            </div>
          )}

          {/* Location */}
          {location && (
            <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <MapPin size={24} className="text-blue-500" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Location
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">{location}</p>
                </div>
              </div>
            </div>
          )}

          {/* Styles */}
          {styles && styles.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
                {t.styles}
              </h3>
              <div className="flex flex-wrap gap-2">
                {styles.map((style, idx) => (
                  <span
                    key={idx}
                    className="rounded-full bg-blue-100 px-4 py-2 font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {style}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Equipment */}
          {equipment && (
            <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
                {t.equipment}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">{equipment}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact */}
          <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
              {t.contact}
            </h3>
            <div className="space-y-3">
              {user?.email && (
                <div className="flex items-center gap-3">
                  <Mail size={20} className="text-blue-500" />
                  <a
                    href={`mailto:${user.email}`}
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {user.email}
                  </a>
                </div>
              )}
              {user?.phoneNumber && (
                <div className="flex items-center gap-3">
                  <Phone size={20} className="text-green-500" />
                  <a
                    href={`tel:${user.phoneNumber}`}
                    className="text-gray-600 hover:underline dark:text-gray-300"
                  >
                    {user.phoneNumber}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Social Links */}
          {socialLinks && Object.keys(socialLinks).some((k) => socialLinks[k]) && (
            <div className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
                {t.socialLinks}
              </h3>
              <div className="space-y-2">
                {socialLinks.facebook && (
                  <a
                    href={socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:underline dark:text-blue-400"
                  >
                    <Facebook size={20} />
                    Facebook
                  </a>
                )}
                {socialLinks.instagram && (
                  <a
                    href={socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-pink-600 hover:underline dark:text-pink-400"
                  >
                    <Instagram size={20} />
                    Instagram
                  </a>
                )}
                {socialLinks.website && (
                  <a
                    href={socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-600 hover:underline dark:text-gray-300"
                  >
                    <Globe size={20} />
                    Website
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Book Button */}
          <button className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 font-bold text-white transition-all duration-200 hover:from-blue-600 hover:to-purple-700">
            {t.bookNow}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotographerProfile;
