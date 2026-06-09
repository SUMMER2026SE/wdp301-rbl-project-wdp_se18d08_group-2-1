const Album = require("./album.model");
const Booking = require("../booking/booking.model");

class AlbumService {
  async createOrUpdateAlbum(bookingId, photographerUserId, newImages) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.photographer.toString() !== photographerUserId.toString()) {
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
    await booking.save();

    return savedAlbum;
  }

  async getAlbumByBookingId(bookingId) {
    const album = await Album.findOne({ bookingId });
    if (!album) {
      throw new Error("Album not found for this booking");
    }
    return album;
  }
}

module.exports = new AlbumService();
