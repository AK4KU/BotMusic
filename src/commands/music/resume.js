const { SlashCommandBuilder } = require('discord.js');

function resumeLogic(guild, client) {
  const queue = client.queues.get(guild.id);
  if (!queue || !queue.currentTrack) return '❌ Tidak ada lagu yang di-pause.';
  if (!queue.isPaused) return '▶️ Musik tidak sedang di-pause.';
  queue.resume();
  return '▶️ Musik dilanjutkan.';
}

module.exports = {
  name: 'resume',
  aliases: ['r'],
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Lanjutkan lagu yang di-pause'),

  async execute(interaction, client) {
    const msg = resumeLogic(interaction.guild, client);
    await interaction.reply(msg);
  },

  async executePrefix(message, args, client) {
    const msg = resumeLogic(message.guild, client);
    await message.reply(msg);
  },
};
