let handler = async (m, { conn, args, usedPrefix, command }) => {
  let owner = m.sender.split`@`[0]
  let bot = global.conns.find(con => con.user.jid.split`@`[0] == owner)
  if (!bot) return m.reply(`*No se encontró ningún sub bot para el usuario @${owner}*`, false, { mentions: [m.sender] })
  if (!args[0]) throw `🎌 *Ingrese la URL del video para el menú*`
  let settings = global.db.data.settings[bot.user.jid]
  if (!settings) return m.reply(`*No se encontró la configuración para el sub bot*`)
  if (!args[0].match(/https?:\/\//)) throw `*La URL debe comenzar con http o https*`
  settings.video = args[0]
  m.reply(`*El video del menú del sub bot fue cambiado*`)
}
handler.help = ["setvideosub"]
handler.tags = ["subbot"]
handler.command = /^(setvideosub)$/i
export default handler
