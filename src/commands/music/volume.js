const { SlashCommandBuilder } = require('discord.js');

function volumeLogic(guild, client, value) {
  const queue = client.queues.get(guild.id);
  if (!queue) return '❌ Tidak ada queue yang aktif.';

  const vol = parseInt(value);
  if (isNaN(vol) || vol < 0 || vol > 200) {
    return '❌ Volume harus antara 0 dan 200.';
  }

  queue.setVolume(vol / 100);
  return `🔊 Volume diset ke **${vol}%**`;
}

module.exports = {
  name: 'volume',
  aliases: ['vol', 'v'],
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Atur volume bot (0-200)')
    .addIntegerOption(opt =>
      opt.setName('level')
        .setDescription('Level volume (0-200), default 100')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(200)
    ),

  async execute(interaction, client) {
    const level = interaction.options.getInteger('level');
    const msg = volumeLogic(interaction.guild, client, level);
    await interaction.reply(msg);
  },

  async executePrefix(message, args, client) {
    const level = args[0];
    if (!level) return message.reply('❌ Contoh: `!volume 80`');
    const msg = volumeLogic(message.guild, client, level);
    await message.reply(msg);
  },
};
