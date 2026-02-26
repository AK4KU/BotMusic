module.exports = {
  name: 'clientReady',
  once: true,
  execute(client) {
    console.log(`✅ Bot berjalan sebagai: ${client.user.tag}`);
    client.user.setActivity('musik 🎵 | /play', { type: 2 }); // 2 = Listening
  },
};
