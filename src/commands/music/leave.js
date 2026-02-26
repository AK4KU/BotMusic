const { SlashCommandBuilder } = require('discord.js');

function leaveLogic(guild, client) {
  const queue = client.queues.get(guild.id);
  if (!queue) return '❌ Bot tidak sedang berada di voice channel.';
  queue.destroy();
  return '👋 Bot keluar dari voice channel.';
}

module.exports = {
  name: 'leave',
  aliases: ['disconnect', 'dc'],
  data: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Keluarkan bot dari voice channel'),

  async execute(interaction, client) {
    const msg = leaveLogic(interaction.guild, client);
    await interaction.reply(msg);
  },

  async executePrefix(message, args, client) {
    const msg = leaveLogic(message.guild, client);
    await message.reply(msg);
  },
};
