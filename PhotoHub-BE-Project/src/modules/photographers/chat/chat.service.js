const Conversation = require("./conversation.model");
const Message = require("./message.model");

const USER_SELECT = "fullName email avatar role";

class ChatService {
  async populateConversation(conversation) {
    if (!conversation) return null;
    return await conversation.populate([
      { path: "participants", select: USER_SELECT },
      { path: "lastMessage", populate: { path: "senderId", select: USER_SELECT } },
    ]);
  }

  async getConversations(userId) {
    return await Conversation.find({ participants: userId })
      .populate("participants", USER_SELECT)
      .populate({ path: "lastMessage", populate: { path: "senderId", select: USER_SELECT } })
      .sort({ updatedAt: -1 });
  }

  async getConversationById(conversationId) {
    return await Conversation.findById(conversationId);
  }

  async getMessages(conversationId, userId = null) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (userId && !conversation.participants.map((id) => id.toString()).includes(userId.toString())) {
      throw new Error("You are not part of this conversation");
    }

    return await Message.find({ conversationId })
      .populate("senderId", USER_SELECT)
      .sort({ createdAt: 1 });
  }

  async createMessage(conversationId, senderId, payload = {}) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (!conversation.participants.map((id) => id.toString()).includes(senderId.toString())) {
      throw new Error("You are not part of this conversation");
    }

    const {
      text = "",
      messageType = "text",
      attachments = [],
      metadata = {},
    } = typeof payload === "string" ? { text: payload } : payload;

    if (!String(text).trim() && attachments.length === 0) {
      throw new Error("Message text or attachment is required");
    }

    const message = new Message({
      conversationId,
      senderId,
      text: String(text || "").trim(),
      messageType,
      attachments,
      metadata,
      evidenceLocked: true,
    });

    const savedMessage = await message.save();

    conversation.lastMessage = savedMessage._id;
    await conversation.save();

    return await Message.findById(savedMessage._id).populate("senderId", USER_SELECT);
  }

  async findOrCreateConversation(participants, bookingId = null, jobPostId = null) {
    const sortedParticipants = [...new Set(participants.map((id) => id.toString()))].sort();
    if (sortedParticipants.length < 2) {
      throw new Error("Conversation requires two different participants");
    }

    const query = {
      participants: { $all: sortedParticipants, $size: sortedParticipants.length },
    };

    if (bookingId) query.bookingId = bookingId;
    if (jobPostId) query.jobPostId = jobPostId;

    let conversation = await Conversation.findOne(query);

    if (!conversation) {
      conversation = new Conversation({
        participants: sortedParticipants,
        bookingId,
        jobPostId,
      });
      await conversation.save();
    }

    return await this.populateConversation(conversation);
  }
}

module.exports = new ChatService();
