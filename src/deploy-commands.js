require('dotenv').config();
const { REST, Routes } = require('discord.js');
const { readdirSync } = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const folders = readdirSync(commandsPath);

for (const folder of folders) {
  const files = readdirSync(path.join(commandsPath, folder)).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const cmd = require(path.join(commandsPath, folder, file));
    if (cmd.data) {
      commands.push(cmd.data.toJSON());
    }
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`🔄 Mendaftarkan ${commands.length} slash command ke guild ${process.env.GUILD_ID}...`);
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('✅ Slash commands berhasil didaftarkan!');
  } catch (err) {
    console.error(err);
  }
})();
