const { SlashCommandBuilder } = require('discord.js');

function loopLogic(guild, client, mode) {
  const queue = client.queues.get(guild.id);
  if (!queue) return '❌ Tidak ada queue yang aktif.';

  if (mode === 'track') {
    queue.loop = !queue.loop;
    queue.loopQueue = false;
    return queue.loop ? '🔂 Loop lagu **aktif**.' : '🔂 Loop lagu **dimatikan**.';
  }
  if (mode === 'queue') {
    queue.loopQueue = !queue.loopQueue;
    queue.loop = false;
    return queue.loopQueue ? '🔁 Loop queue **aktif**.' : '🔁 Loop queue **dimatikan**.';
  }
  if (mode === 'off') {
    queue.loop = false;
    queue.loopQueue = false;
    return '➡️ Loop **dimatikan**.';
  }

  // Toggle jika tidak ada mode
  if (queue.loop) {
    queue.loop = false;
    queue.loopQueue = true;
    return '🔁 Loop beralih ke **loop queue**.';
  } else if (queue.loopQueue) {
    queue.loop = false;
    queue.loopQueue = false;
    return '➡️ Loop **dimatikan**.';
  } else {
    queue.loop = true;
    return '🔂 Loop lagu **aktif**.';
  }
}

module.exports = {
  name: 'loop',
  aliases: ['l', 'repeat'],
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Atur mode loop: track, queue, atau off')
    .addStringOption(opt =>
      opt.setName('mode')
        .setDescription('Mode loop')
        .setRequired(false)
        .addChoices(
          { name: '🔂 Track (lagu saat ini)', value: 'track' },
          { name: '🔁 Queue (seluruh queue)', value: 'queue' },
          { name: '➡️ Off (matikan loop)', value: 'off' },
        )
    ),

  async execute(interaction, client) {
    const mode = interaction.options.getString('mode') || null;
    const msg = loopLogic(interaction.guild, client, mode);
    await interaction.reply(msg);
  },

  async executePrefix(message, args, client) {
    const mode = args[0]?.toLowerCase() || null;
    const msg = loopLogic(message.guild, client, mode);
    await message.reply(msg);
  },
};
