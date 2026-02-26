const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

async function npLogic(guild, client) {
  const queue = client.queues.get(guild.id);
  if (!queue || !queue.currentTrack) {
    return { content: '❌ Tidak ada lagu yang sedang diputar.' };
  }

  const t = queue.currentTrack;
  const embed = new EmbedBuilder()
    .setColor(0x1db954)
    .setTitle('🎵 Sedang Diputar')
    .setDescription(`**[${t.title}](${t.url})**`)
    .addFields(
      { name: 'Durasi', value: `\`${t.duration}\``, inline: true },
      { name: 'Artis', value: t.artist || 'Tidak diketahui', inline: true },
      { name: 'Diminta oleh', value: t.requestedBy, inline: true },
    )
    .setThumbnail(t.thumbnail || null)
    .setFooter({ text: `Status: ${queue.isPaused ? '⏸️ Paused' : '▶️ Playing'} | Volume: ${Math.round(queue.volume * 100)}%` });

  return { embeds: [embed] };
}

module.exports = {
  name: 'nowplaying',
  aliases: ['np', 'current'],
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Tampilkan lagu yang sedang diputar'),

  async execute(interaction, client) {
    const payload = await npLogic(interaction.guild, client);
    await interaction.reply(payload);
  },

  async executePrefix(message, args, client) {
    const payload = await npLogic(message.guild, client);
    await message.reply(payload);
  },
};
