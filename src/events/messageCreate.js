module.exports = {
  name: 'messageCreate',
  once: false,
  async execute(message, client) {
    if (message.author.bot) return;

    const prefix = process.env.BOT_PREFIX || '!';
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();

    const command = client.prefixCommands.get(commandName);
    if (!command) return;

    try {
      await command.executePrefix(message, args, client);
    } catch (err) {
      console.error(`[MessageCreate] Error: ${err.message}`);
      message.reply(`❌ Terjadi error: ${err.message}`).catch(() => {});
    }
  },
};
