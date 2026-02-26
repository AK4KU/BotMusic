const { SlashCommandBuilder } = require('discord.js');

function stopLogic(guild, client) {
  const queue = client.queues.get(guild.id);
  if (!queue) return '❌ Tidak ada queue yang aktif.';
  queue.destroy();
  return '⏹️ Musik dihentikan dan queue dikosongkan.';
}

module.exports = {
  name: 'stop',
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Hentikan musik dan kosongkan queue'),

  async execute(interaction, client) {
    const msg = stopLogic(interaction.guild, client);
    await interaction.reply(msg);
  },

  async executePrefix(message, args, client) {
    const msg = stopLogic(message.guild, client);
    await message.reply(msg);
  },
};
