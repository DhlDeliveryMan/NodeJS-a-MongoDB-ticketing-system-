require("dotenv").config();
const discord = require("discord.js");
const mongoose = require("mongoose");

const client = new discord.Client();

const Member = require("../database/MemberModel");
const Ticket = require("../database/TicketModel");

client.login(process.env.TOKEN);

const prefix = "!";

client.on("ready", () => {
  console.log("bot ready!");
  mongoose.connect(process.env.MONGODBURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

client.on("guildMemberAdd", async (member) => {
  const newUser = new Member({
    guildId: member.guild.id,
    userId: member.id,
    tag: member.user.tag,
    pfp: member.user.avatarURL({ format: "png" }),
    banned: false,
  });

  try {
    Member.findOne({ userId: member.id }, (err, member) => {
      if (err) {
        console.log(err);
        return;
      } else {
        if (member) {
          return;
        } else {
          newUser.save().then((user) => console.log(user));
        }
      }
    });
  } catch (err) {
    console.log(err);
  }
});

client.on("message", async (message) => {
  let args = message.content.substring(prefix.length).split(" ");
  switch (args[0]) {
    case "ticket":
      Member.findOne({ userId: message.author.id }, async (err, member) => {
        if (err) {
          const msg = await message.channel
            .send(`FAILED TO CREATE TICKET DUE TO ERROR.`)
            .then((m) => m.delete(8000));
          console.log(err);
          return;
        } else {
          if (member) {
            Ticket.findOne(
              { userId: message.author.id },
              async (err, tickets) => {
                if (err) {
                  const msg = await message.channel
                    .send(`FAILED TO CREATE TICKET DUE TO ERROR.`)
                    .then((m) => m.delete(8000));
                  console.log(err);
                } else {
                  if (tickets) {
                    const errorembed = new discord.MessageEmbed()
                      .setTitle(`**Failiure**`)
                      .setDescription(
                        `You already have a ticket open, so you may not open another one. Please contact staff if you feel that this is a mistake`
                      )
                      .setFooter(`Ticketing bot`)
                      .setTimestamp()
                      .setColor("RED");
                    message.author.send({ embed: errorembed });
                  } else {
                    Member.findOne(
                      { userId: message.author.id },
                      async (err, member) => {
                        if (err) {
                          const msg = await message.channel
                            .send(`FAILED TO CREATE TICKET DUE TO ERROR.`)
                            .then((m) => m.delete(8000));
                          console.log(err);
                        } else {
                          try {
                            console.log(member.banneds);
                            if (member.banned === false) {
                              const channel = message.guild.channels
                                .create(`${message.author.tag}\'s Ticket`, {
                                  type: "text",
                                  permissionOverwrites: [
                                    {
                                      id: message.guild.id,
                                      deny: ["VIEW_CHANNEL"],
                                    },
                                    {
                                      id: message.author.id,
                                      allow: ["VIEW_CHANNEL"],
                                    },
                                    //add other roles here!
                                  ],
                                })
                                .then((ch) => {
                                  const ticket = new Ticket({
                                    guildId: message.guild.id,
                                    userId: message.author.id,
                                    tag: message.author.tag,
                                    pfp: message.author.avatarURL({
                                      format: "png",
                                    }),
                                    channelId: ch.id,
                                  });

                                  ticket
                                    .save()
                                    .then((ticket) => console.log(ticket))
                                    .catch((err) => console.log(err));

                                  const tembed = new discord.MessageEmbed()
                                    .setTitle(`**New ticket!**`)
                                    .setDescription(
                                      `You have opened a ticket! Please describe your issue. A support team member will be with you shortly.\n **To close the ticket please run !close in this channel.**`
                                    )
                                    .setFooter(`Ticketing bot`)
                                    .setTimestamp()
                                    .setColor("GREEN");
                                  ch.send({ embed: tembed });
                                });
                            } else {
                              const banemb = new discord.MessageEmbed()
                                .setTitle(`**Error**`)
                                .setDescription(
                                  `You have been banned from making a ticket. Please contact staff for an appeal.`
                                )
                                .setFooter(`Ticketing bot`)
                                .setTimestamp()
                                .setColor("RED");
                              message.author.send({ embed: banemb });
                            }
                          } catch (err) {
                            console.log(err);
                          }
                        }
                      }
                    );
                  }
                }
              }
            );
          } else {
            console.log("UH OH!");
          }
        }
      });
  }
});

client.on("message", async (message) => {
  let args = message.content.substring(prefix.length).split(" ");
  switch (args[0]) {
    case "ban":
    case "close":
      Ticket.findOne({ channelId: message.channel.id }, async (err, ticket) => {
        console.log(ticket);

        if (err) {
          return;
        }
        if (ticket) {
          if (message.channel.id === ticket.channelId) {
            const finishembed = new discord.MessageEmbed()
              .setTitle(`**Ticket closed!**`)
              .setDescription(`Your ticket has been closed!`)
              .setFooter(`Ticketing bot`)
              .setTimestamp()
              .setColor("GREEN");
            const user = client.users.cache.find(
              (user) => user.id === ticket.userId
            );
            user.send({ embed: finishembed });
            Ticket.findOneAndDelete({ _id: ticket._id }, (err, deleted) => {
              console.log("Deleted ticket: " + deleted);
            });
            message.channel.delete();
          } else {
            const noticketembed = new discord.MessageEmbed()
              .setTitle(`**No ticket found!**`)
              .setDescription(
                `You are not in a ticket, so you may not close this ticket!`
              )
              .setFooter(`Ticketing bot`)
              .setTimestamp()
              .setColor("RED");
            message.author.send({ embed: noticketembed });
          }
        } else {
          const noticketembed_1 = new discord.MessageEmbed()
            .setTitle(`**No ticket found!**`)
            .setDescription(
              `You are not in a ticket, so you may not close this ticket!`
            )
            .setFooter(`Ticketing bot`)
            .setTimestamp()
            .setColor("RED");
          message.author.send({ embed: noticketembed_1 });
        }
      });
  }
});

client.on("message", async (message) => {
  let args = message.content.substring(prefix.length).split(" ");
  switch (args[0]) {
    case "ticketban":
      const user = message.mentions.members.first();
      if (!user) {
        message.channel.send(`**Error: please mention a user.**`);
        return;
      }
      Member.findOneAndUpdate(
        { userId: user.id },
        { banned: true },
        {},
        (err, doc) => {
          if (err) {
            console.log(err);
            return;
          }
          message.channel.send(
            `**${user.user.tag} has been banned from creating tickets.**`
          );
        }
      );
  }
});
