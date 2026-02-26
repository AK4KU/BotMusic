const { SlashCommandBuilder } = require('discord.js');

function skipLogic(guild, client) {
  const queue = client.queues.get(guild.id);
  if (!queue || !queue.currentTrack) return '❌ Tidak ada lagu yang sedang diputar.';
  const skipped = queue.currentTrack.title;
  queue.skip();
  return `⏭️ Melewati: **${skipped}**`;
}

module.exports = {
  name: 'skip',
  aliases: ['s'],
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Lewati lagu yang sedang diputar'),

  async execute(interaction, client) {
    const msg = skipLogic(interaction.guild, client);
    await interaction.reply(msg);
  },

  async executePrefix(message, args, client) {
    const msg = skipLogic(message.guild, client);
    await message.reply(msg);
  },
};
