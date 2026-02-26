const { SlashCommandBuilder } = require('discord.js');

function pauseLogic(guild, client) {
  const queue = client.queues.get(guild.id);
  if (!queue || !queue.isPlaying) return '❌ Tidak ada lagu yang sedang diputar.';
  if (queue.isPaused) return '⏸️ Musik sudah di-pause.';
  queue.pause();
  return '⏸️ Musik di-pause.';
}

module.exports = {
  name: 'pause',
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause lagu yang sedang diputar'),

  async execute(interaction, client) {
    const msg = pauseLogic(interaction.guild, client);
    await interaction.reply(msg);
  },

  async executePrefix(message, args, client) {
    const msg = pauseLogic(message.guild, client);
    await message.reply(msg);
  },
};
