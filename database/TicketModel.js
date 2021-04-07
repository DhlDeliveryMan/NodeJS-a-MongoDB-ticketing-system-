const mongoose = require("mongoose");

const ticketSchema = mongoose.Schema({
  guildId: {
    type: String,
  },
  userId: {
    type: String,
  },
  tag: {
    type: String,
  },
  pfp: {
    type: String,
  },
  channelId: { type: String },
});

module.exports = mongoose.model("ticket", ticketSchema);
