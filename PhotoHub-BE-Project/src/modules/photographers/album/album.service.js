const Album = require("./album.model");
const Booking = require("../booking/booking.model");
const Payment = require("../../admin/models/Payment");
const Dispute = require("../../admin/models/Dispute");
const { getPhotographerIdentity } = require("../utils/photographerIdentity");

const OPEN_DISPUTE_STATUSES = ["OPEN", "INVESTIGATING"];
const SUCCESS_PAYMENT_STATUS = "SUCCESS";

const getBookingAmount = (booking) => Number(booking.price || booking.totalPrice || 0);

const isPrivilegedAlbumViewer = async (booking, user) => {
  if (!user) return false;
  const userId = String(user.id);
  if (String(booking.customer) === userId || ["admin", "manager"].includes(user.role)) {
    return true;
  }

  const identity = await getPhotographerIdentity(userId);
  return identity.ids.includes(String(booking.photographer));
};

class AlbumService {
  async createOrUpdateAlbum(bookingId, photographerUserId, newImages) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    const identity = await getPhotographerIdentity(photographerUserId);
    if (!identity.ids.includes(booking.photographer.toString())) {
      throw new Error("You are not authorized to upload albums for this booking");
    }

    let album = await Album.findOne({ bookingId });

    if (!album) {
      album = new Album({
        bookingId,
        photographerId: photographerUserId,
        images: newImages,
      });
    } else {
      album.images.push(...newImages);
    }

    const savedAlbum = await album.save();

    booking.finalAlbum = savedAlbum._id;
    booking.completionStatus = "album_uploaded";
    if (!booking.deliveryDeadline) {
      booking.deliveryDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    await booking.save();

    return savedAlbum;
  }

  async hasFullPayment(booking) {
    if (booking.paymentStatus === "paid") {
      return true;
    }

    const payments = await Payment.find({
      booking: booking._id,
      status: SUCCESS_PAYMENT_STATUS,
      paymentType: { $in: ["DEPOSIT", "FINAL"] },
    }).select("amount paymentType");

    const paidAmount = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const bookingAmount = getBookingAmount(booking);
    return bookingAmount > 0 ? paidAmount >= bookingAmount : payments.length > 0;
  }

  async hasOpenDispute(bookingId) {
    const dispute = await Dispute.findOne({
      booking: bookingId,
      status: { $in: OPEN_DISPUTE_STATUSES },
    }).select("_id status title");

    return dispute;
  }

  formatAlbumForAccess(album, canDownloadFullHD, openDispute) {
    const albumObject = album.toObject();
    return {
      ...albumObject,
      canDownloadFullHD,
      fullHdLocked: !canDownloadFullHD,
      lockedReason: openDispute
        ? "Full-HD downloads are locked while a dispute is open"
        : canDownloadFullHD
          ? null
          : "Full-HD downloads unlock after full payment",
      images: albumObject.images.map((image) => ({
        _id: image._id,
        url: image.previewUrl || image.watermarkUrl || image.url,
        previewUrl: image.previewUrl || image.url,
        watermarkUrl: image.watermarkUrl || image.previewUrl || image.url,
        downloadUrl: canDownloadFullHD ? image.downloadUrl || image.url : null,
        originalName: image.originalName,
        size: image.size,
        mimetype: image.mimetype,
        uploadedAt: image.uploadedAt,
        isWatermarkedPreview: !canDownloadFullHD,
      })),
    };
  }

  async getAlbumByBookingId(bookingId, user) {
    const [album, booking] = await Promise.all([
      Album.findOne({ bookingId }),
      Booking.findById(bookingId),
    ]);

    if (!album) {
      throw new Error("Album not found for this booking");
    }

    if (!booking) {
      throw new Error("Booking not found");
    }

    if (!(await isPrivilegedAlbumViewer(booking, user))) {
      throw new Error("You are not authorized to view this album");
    }

    const [fullPayment, openDispute] = await Promise.all([
      this.hasFullPayment(booking),
      this.hasOpenDispute(booking._id),
    ]);

    const canDownloadFullHD = Boolean(fullPayment && !openDispute);
    return this.formatAlbumForAccess(album, canDownloadFullHD, openDispute);
  }
}

module.exports = new AlbumService();
