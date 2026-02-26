const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

async function queueLogic(guild, client) {
  const queue = client.queues.get(guild.id);
  if (!queue || (!queue.currentTrack && queue.tracks.length === 0)) {
    return { content: '❌ Queue kosong.' };
  }

  const perPage = 10;
  const tracks = queue.tracks.slice(0, perPage);

  const embed = new EmbedBuilder()
    .setColor(0x1db954)
    .setTitle('📋 Music Queue');

  let desc = '';
  if (queue.currentTrack) {
    desc += `**▶️ Sedang diputar:**\n[${queue.currentTrack.title}](${queue.currentTrack.url}) \`${queue.currentTrack.duration}\`\n\n`;
  }

  if (tracks.length > 0) {
    desc += '**Selanjutnya:**\n';
    tracks.forEach((t, i) => {
      desc += `\`${i + 1}.\` [${t.title}](${t.url}) \`${t.duration}\` - ${t.requestedBy}\n`;
    });
    if (queue.tracks.length > perPage) {
      desc += `\n...dan **${queue.tracks.length - perPage}** lagu lainnya.`;
    }
  } else {
    desc += '_Queue kosong._';
  }

  embed.setDescription(desc);
  embed.setFooter({ text: `Total: ${queue.tracks.length} lagu | Loop: ${queue.loop ? '🔂 ON' : 'OFF'} | Loop Queue: ${queue.loopQueue ? '🔁 ON' : 'OFF'}` });

  return { embeds: [embed] };
}

module.exports = {
  name: 'queue',
  aliases: ['q'],
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Tampilkan daftar lagu dalam queue'),

  async execute(interaction, client) {
    const payload = await queueLogic(interaction.guild, client);
    await interaction.reply(payload);
  },

  async executePrefix(message, args, client) {
    const payload = await queueLogic(message.guild, client);
    await message.reply(payload);
  },
};
