const handler = async (sock, m, { text }) => {
    await sock.sendMessage(m.key.remoteJid, { text: 'Pong' }, { quoted: m });
};

handler.help = ['ping'];
handler.tags = ['info'];
handler.command = ['ping'];
handler.register = true;

export default handler;
