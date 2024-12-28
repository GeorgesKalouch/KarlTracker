import { REST, Routes } from "discord.js";
import "dotenv/config";

// Define your slash commands
const commands = [
  {
    name: "ping",
    description: "Replies with Pong!",
  },
];

// Initialize the REST client
const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

// Deploy the commands
(async () => {
  try {
    console.log("Started refreshing slash commands...");

    // Use Routes.applicationCommands to register globally (available in all servers)
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });
    console.log("Successfully reloaded slash commands!");
  } catch (error) {
    console.error("Error registering slash commands:", error);
  }
})();
