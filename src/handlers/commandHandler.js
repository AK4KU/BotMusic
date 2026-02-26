const { readdirSync } = require('fs');
const path = require('path');

function loadCommands(client) {
  const commandsPath = path.join(__dirname, '..', 'commands');
  const folders = readdirSync(commandsPath);

  for (const folder of folders) {
    const files = readdirSync(path.join(commandsPath, folder)).filter(f => f.endsWith('.js'));
    for (const file of files) {
      const command = require(path.join(commandsPath, folder, file));
      if (command.data) {
        client.commands.set(command.data.name, command);
      }
      if (command.name) {
        client.prefixCommands.set(command.name, command);
        if (command.aliases) {
          for (const alias of command.aliases) {
            client.prefixCommands.set(alias, command);
          }
        }
      }
    }
  }

  console.log(`[Commands] ${client.commands.size} slash command(s) dan ${client.prefixCommands.size} prefix command(s) dimuat.`);
}

module.exports = { loadCommands };
