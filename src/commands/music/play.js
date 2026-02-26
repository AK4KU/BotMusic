const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const MusicQueue = require('../../utils/MusicQueue');
const { resolveTracks } = require('../../utils/trackResolver');

async function play(interaction_or_message, input, client, isSlash = true) {
  const guild = isSlash ? interaction_or_message.guild : interaction_or_message.guild;
  const member = isSlash ? interaction_or_message.member : interaction_or_message.member;
  const channel = isSlash ? interaction_or_message.channel : interaction_or_message.channel;

  const voiceChannel = member?.voice?.channel;
  if (!voiceChannel) {
    const msg = '❌ Kamu harus berada di voice channel terlebih dahulu!';
    return isSlash ? interaction_or_message.editReply(msg) : interaction_or_message.reply(msg);
  }

  const botPermissions = voiceChannel.permissionsFor(guild.members.me);
  if (!botPermissions.has('Connect') || !botPermissions.has('Speak')) {
    const msg = '❌ Bot tidak punya izin untuk masuk/berbicara di voice channel itu.';
    return isSlash ? interaction_or_message.editReply(msg) : interaction_or_message.reply(msg);
  }

  if (!input || !input.trim()) {
    const msg = '❌ Masukkan URL atau nama lagu!';
    return isSlash ? interaction_or_message.editReply(msg) : interaction_or_message.reply(msg);
  }

  const requestedBy = isSlash
    ? `<@${interaction_or_message.user.id}>`
    : `<@${interaction_or_message.author.id}>`;

  let tracks;
  try {
    tracks = await resolveTracks(input, requestedBy);
  } catch (err) {
    const msg = `❌ ${err.message}`;
    return isSlash ? interaction_or_message.editReply(msg) : interaction_or_message.reply(msg);
  }

  // Dapatkan atau buat queue
  let queue = client.queues.get(guild.id);
  if (!queue) {
    queue = new MusicQueue(guild.id, client);
    client.queues.set(guild.id, queue);
    queue.textChannel = channel;
    try {
      await queue.connect(voiceChannel);
    } catch (err) {
      client.queues.delete(guild.id);
      const msg = `❌ ${err.message}`;
      return isSlash ? interaction_or_message.editReply(msg) : interaction_or_message.reply(msg);
    }
  } else {
    // Queue ada — pastikan koneksi masih valid
    queue.textChannel = channel;
    const needConnect = !queue.connection || queue.connection.state.status === 'destroyed';
    const wrongChannel = !needConnect && queue.connection?.joinConfig?.channelId !== voiceChannel.id;
    if (needConnect || wrongChannel) {
      try {
        await queue.connect(voiceChannel);
      } catch (err) {
        client.queues.delete(guild.id);
        const msg = `❌ ${err.message}`;
        return isSlash ? interaction_or_message.editReply(msg) : interaction_or_message.reply(msg);
      }
    }
  }

  // Tambahkan tracks ke queue
  for (const track of tracks) {
    queue.addTrack(track);
  }

  const embed = new EmbedBuilder().setColor(0x1db954);

  if (tracks.length === 1) {
    embed
      .setTitle('🎵 Ditambahkan ke Queue')
      .setDescription(`**[${tracks[0].title}](${tracks[0].url})**\nDurasi: \`${tracks[0].duration}\`\nDiminta oleh: ${tracks[0].requestedBy}`)
      .setThumbnail(tracks[0].thumbnail || null);
  } else {
    embed
      .setTitle('🎵 Playlist Ditambahkan ke Queue')
      .setDescription(`**${tracks.length} lagu** ditambahkan.\nLagu pertama: **${tracks[0].title}**`);
  }

  if (!queue.isPlaying && !queue.isPaused) {
    await queue.playNext();
  }

  return isSlash ? interaction_or_message.editReply({ embeds: [embed] }) : interaction_or_message.reply({ embeds: [embed] });
}

module.exports = {
  name: 'play',
  aliases: ['p'],
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Putar lagu dari YouTube atau Spotify')
    .addStringOption(opt =>
      opt.setName('input')
        .setDescription('URL atau nama lagu/playlist')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    await interaction.deferReply();
    const input = interaction.options.getString('input');
    await play(interaction, input, client, true);
  },

  async executePrefix(message, args, client) {
    const input = args.join(' ');
    await play(message, input, client, false);
  },
};
