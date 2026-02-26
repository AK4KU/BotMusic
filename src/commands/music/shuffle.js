const { SlashCommandBuilder } = require('discord.js');

function shuffleLogic(guild, client) {
  const queue = client.queues.get(guild.id);
  if (!queue || queue.tracks.length < 2) return '❌ Queue tidak cukup untuk di-shuffle (butuh minimal 2 lagu).';
  queue.shuffle();
  return `🔀 Queue berhasil di-shuffle! (${queue.tracks.length} lagu)`;
}

module.exports = {
  name: 'shuffle',
  aliases: ['sh'],
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Acak urutan lagu dalam queue'),

  async execute(interaction, client) {
    const msg = shuffleLogic(interaction.guild, client);
    await interaction.reply(msg);
  },

  async executePrefix(message, args, client) {
    const msg = shuffleLogic(message.guild, client);
    await message.reply(msg);
  },
};
