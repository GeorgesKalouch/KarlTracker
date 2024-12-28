const commands = {
  ping: {
    description: "Replies with Pong!",
    execute: (message) => {
      message.channel.send("Pong!");
    },
  },
};

export default commands;
