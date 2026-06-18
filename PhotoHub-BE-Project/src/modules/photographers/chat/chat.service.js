const Conversation = require("./conversation.model");
const Message = require("./message.model");

class ChatService {
  async getConversations(userId) {
    return await Conversation.find({ participants: userId })
      .populate("participants", "fullName email avatar role")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });
  }

  async getMessages(conversationId) {
    return await Message.find({ conversationId }).sort({ createdAt: 1 });
  }

  async createMessage(conversationId, senderId, text) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (!conversation.participants.map(id => id.toString()).includes(senderId.toString())) {
      throw new Error("You are not part of this conversation");
    }

    const message = new Message({
      conversationId,
      senderId,
      text,
    });

    const savedMessage = await message.save();

    conversation.lastMessage = savedMessage._id;
    await conversation.save();

    return savedMessage;
  }

  async findOrCreateConversation(participants, bookingId = null, jobPostId = null) {
    const sortedParticipants = [...participants].sort();

    let query = {
      participants: { $all: sortedParticipants, $size: sortedParticipants.length }
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

    return conversation;
  }
}

module.exports = new ChatService();
