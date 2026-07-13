const BookingAddon = require("../models/BookingAddon");
const ApiResponse = require("../../../utils/ApiResponse");

class AddonController {
  async getAddonByBookingId(req, res) {
    try {
      const { bookingId } = req.params;
      const addon = await BookingAddon.findOne({ bookingId });
      if (!addon) {
        // Return default empty addon instead of error to simplify frontend flow
        return ApiResponse.success(
          res,
          {
            bookingId,
            makeup: false,
            costume: false,
            studio: false,
            makeupDetails: "",
            costumeDetails: "",
            studioDetails: "",
            addonPrice: 0,
          },
          "No addons configured yet"
        );
      }
      return ApiResponse.success(res, addon, "Get booking addons successful");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }

  async createOrUpdateAddon(req, res) {
    try {
      const { bookingId } = req.params;
      const { makeup, costume, studio, makeupDetails, costumeDetails, studioDetails, addonPrice } = req.body;

      let addon = await BookingAddon.findOne({ bookingId });
      if (addon) {
        addon.makeup = makeup !== undefined ? makeup : addon.makeup;
        addon.costume = costume !== undefined ? costume : addon.costume;
        addon.studio = studio !== undefined ? studio : addon.studio;
        addon.makeupDetails = makeupDetails !== undefined ? makeupDetails : addon.makeupDetails;
        addon.costumeDetails = costumeDetails !== undefined ? costumeDetails : addon.costumeDetails;
        addon.studioDetails = studioDetails !== undefined ? studioDetails : addon.studioDetails;
        addon.addonPrice = addonPrice !== undefined ? addonPrice : addon.addonPrice;
        await addon.save();
      } else {
        addon = new BookingAddon({
          bookingId,
          makeup,
          costume,
          studio,
          makeupDetails,
          costumeDetails,
          studioDetails,
          addonPrice,
        });
        await addon.save();
      }

      return ApiResponse.success(res, addon, "Addons updated successfully");
    } catch (error) {
      return ApiResponse.error(res, error.message, 500);
    }
  }
}

module.exports = new AddonController();
