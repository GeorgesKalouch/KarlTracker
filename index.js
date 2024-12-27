import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import fetch from "node-fetch";
import roasts from "./roasts.js";
import express from express;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const app = express();

let cachedMatchId = null;

app.get("/", (req, res) => {
  res.send("KarlTracker Bot is running!");
});

async function getPuuid(summonerName) {
  const response = await fetch(
    `https://${process.env.REGIONAL_ROUTING}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${summonerName}/EUNE?api_key=${process.env.RIOT_API_KEY}`
  );
  const data = await response.json();
  if (data.status) {
    console.error("Error fetching PUUID:", data.status.message);
    return null;
  }
  return data.puuid;
}

async function getLastMatch(puuid) {
  const response = await fetch(
    `https://${process.env.REGIONAL_ROUTING}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=20&api_key=${process.env.RIOT_API_KEY}`
  );
  const matchIds = await response.json();
  if (!Array.isArray(matchIds) || matchIds.length === 0) {
    console.error("No match history found for PUUID:", puuid);
    return null;
  }
  return matchIds[0];
}

async function getMatchDetails(matchId) {
  const response = await fetch(
    `https://${process.env.REGIONAL_ROUTING}.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${process.env.RIOT_API_KEY}`
  );
  const matchDetails = await response.json();
  if (!matchDetails || !matchDetails.info) {
    console.error("Invalid match details:", matchDetails);
    return null;
  }
  return matchDetails.info;
}

async function checkForMatch() {
  const summonerName = process.env.SUMMONER_NAME;
  const puuid = await getPuuid(summonerName);
  if (!puuid) return;

  const lastMatchId = await getLastMatch(puuid);
  if (!lastMatchId || lastMatchId === cachedMatchId) return;
  cachedMatchId = lastMatchId;
  const matchDetails = await getMatchDetails(lastMatchId);
  if (!matchDetails) return;
  const win = matchDetails.participants.some(
    (player) => player.puuid === puuid && player.win
  );

  function getPlayerStats(playerId, matchDetails) {
    const player = matchDetails.participants.find((p) => p.puuid === playerId);
    if (player) {
      return {
        kills: player.kills,
        deaths: player.deaths,
        assists: player.assists,
      };
    }
    return null;
  }

  const kda = getPlayerStats(puuid, matchDetails);
  const matchDuration = (matchDetails.gameDuration / 60).toFixed(0);
  const result = win ? "Victory!" : "Defeat...";
  const winOrLoseEmoji = win ? "🥳🎉" : "😞";
  const roast = roasts[Math.floor(Math.random() * roasts.length)];
  const message = `
  🎮 **Match Update** for ${summonerName}!

  🏆 **Result**: ${result} ${winOrLoseEmoji}
  ⏱️ **Game Duration**: ${matchDuration} minutes
  🕹️ **Game Mode**: ${matchDetails.gameMode}
  💀 **KDA:**: ${kda.kills}/${kda.deaths}/${kda.assists}
  
  ${win ? "Great job, keep it up!" : roast}
  `;

  client.channels.cache.get(process.env.CHANNEL_ID).send(message);
}

client.once("ready", () => {
  console.log("Bot is online!");
  checkForMatch();

  setInterval(checkForMatch, 60000);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

client.login(process.env.DISCORD_TOKEN);
