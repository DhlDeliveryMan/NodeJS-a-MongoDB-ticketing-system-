const mongoose = require("mongoose");

const memberSchema = mongoose.Schema({
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
  banned: {
    type: Boolean,
  },
});

module.exports = mongoose.model("member", memberSchema);
