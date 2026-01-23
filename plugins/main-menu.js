import fs from 'fs'
import { join } from 'path'
import Jimp from 'jimp'
import fetch from 'node-fetch'

let handler = async (m, { conn, usedPrefix, __dirname }) => {
  const delay = ms => new Promise(res => setTimeout(res, ms))

  const imgPath = join(__dirname, '../lib/catalogo.jpg')
  let thumbnail = null
  if (fs.existsSync(imgPath)) {
    try {
      const img = await Jimp.read(imgPath)
      thumbnail = await img.cover(300, 150).quality(100).getBufferAsync(Jimp.MIME_JPEG)
    } catch {
      thumbnail = null
    }
  }

  async function makeFkontak() {
    try {
      const res = await fetch('https://raw.githubusercontent.com/El-brayan502/dat1/main/uploads/aae3a7-1768633999845.jpg') // mini icono
      const thumb2 = Buffer.from(await res.arrayBuffer())
      const iconThumb = await Jimp.read(thumb2)
      const thumbN = await iconThumb.cover(64,64).quality(100).getBufferAsync(Jimp.MIME_JPEG)
      return {
        key: {
          participants: '0@s.whatsapp.net',
          remoteJid: 'status@broadcast',
          fromMe: false,
          id: 'Halo'
        },
        message: {
          locationMessage: {
            name: 'Official WhatsApp Assistant',
            jpegThumbnail: thumbN
          }
        },
        participant: '0@s.whatsapp.net'
      }
    } catch {
      return undefined
    }
  }

  const fakeQuote = await makeFkontak()

  let user = global.db.data.users[m.sender]
  let nombre = await conn.getName(m.sender)
  let premium = user.premium ? 'ɴᴏ ❌' : 'sɪ ✅'
  let limite = user.limit || 0
  let totalreg = Object.keys(global.db.data.users).length
  let groupsCount = Object.values(conn.chats).filter(v => v.id.endsWith('@g.us')).length
  let muptime = clockString(process.uptime())

  function clockString(seconds) {
    let h = Math.floor(seconds / 3600)
    let m = Math.floor(seconds % 3600 / 60)
    let s = Math.floor(seconds % 60)
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':')
  }

  const infoUser = `
> ☃️ _¡Hola!_ *🥀¡Muy buenos días🌅, tardes🌇 o noches🌆!*

> 🎳 \`Yuki:\` sistema automatizado para interactuar con comandos y descargar, buscar y jugar dentro del chat.

━━━━━━━━━━━━━
> ᴜsᴜʀᴀɪᴏ ┆ ${nombre}
> ᴘʀᴇᴍɪᴜᴍ ┆ ${premium}
> ʟɪᴍɪᴛᴇ ┆ ${limite}
> ᴀᴄᴛɪᴠᴏ ┆ ${muptime}
> ᴛᴏᴛᴀʟ ᴜsᴜᴀʀɪᴏs ┆ ${totalreg}
> ɢʀᴜᴘᴏs ┆ ${groupsCount}
━━━━━━━━━━━━━
`.trim()

  let commands = Object.values(global.plugins).filter(v => v.help && v.tags).map(v => {
    return {
      help: Array.isArray(v.help) ? v.help : [v.help],
      tags: Array.isArray(v.tags) ? v.tags : [v.tags]
    }
  })

  let tags = {
    'info': 'ᴍᴇɴᴜ ɪɴғᴏ',
    'anime': 'ᴍᴇɴᴜ ᴀɴɪᴍᴇ',
    'buscador': 'ᴍᴇɴᴜ ʙᴜsᴄᴀᴅᴏʀ',
    'descargas': 'ᴍᴇɴᴜ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ',
    'fun': 'ᴍᴇɴᴜ ғᴜɴ',
    'grupo': 'ᴍᴇɴᴜ ɢʀᴜᴘᴏ',
    'ai': 'ᴍᴇɴᴜ ᴀɪ',
    'game': 'ᴍᴇɴᴜ ɢᴀᴍᴇ',
    'jadibot': 'ᴍᴇɴᴜ ᴊᴀᴅɪʙᴏᴛ',
    'main': 'ᴍᴇɴᴜ ᴍᴀɪɴ',
    'search': 'ᴍᴇɴᴜ SEARCH',
    'nsfw': 'ᴍᴇɴᴜ ɴsғᴡ',
    'owner': 'ᴍᴇɴᴜ ᴏᴡɴᴇʀ',
    'sticker': 'ᴍᴇɴᴜ sᴛɪᴄᴋᴇʀ',
    'tools': 'ᴍᴇɴᴜ ᴛᴏᴏʟs',
    'ia': 'MENU AI',
  }

  let header = '*– %category*'
  let body = '│  ◦ %cmd'
  let footer = '└––'
  let after = `> bot yuki ┆ 𝖠𝗌𝗌𝗂𝗌𝗍𝖺𝗇𝗍`

  let menu = []
  for (let tag in tags) {
    let comandos = commands
      .filter(command => command.tags.includes(tag))
      .map(command => command.help.map(cmd => body.replace(/%cmd/g, usedPrefix + cmd)).join('\n'))
      .join('\n')
    if (comandos) {
      menu.push(header.replace(/%category/g, tags[tag]) + '\n' + comandos + '\n' + footer)
    }
  }

  const finalMenu = infoUser + '\n\n' + menu.join('\n\n') + '\n' + after

  let thumbChannel = null
  try {
    const icon = await Jimp.read(await global.getBuffer(global.imagenRandom))
    thumbChannel = await icon.cover(64,64).quality(100).getBufferAsync(Jimp.MIME_JPEG)
  } catch {
    thumbChannel = null
  }

  await conn.sendMessage(m.chat, {
    document: Buffer.alloc(10), 
    mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileName: 'Yuki bot',
    fileLength: 1024 * 1024 * 1024,
    caption: finalMenu,
    jpegThumbnail: thumbnail,
    contextInfo: {
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363424677971125@newsletter',
        newsletterName: 'Canal de ITACHI',
        serverMessageId: -1
      },
      externalAdReply: {
        title: 'YUKI 𝖡𝗈𝗍 𝖵2 𐂂',
        body: 'YUkIbotV2',
        thumbnailUrl: 'https://qu.ax/DVlzO',
        thumbnail: thumbChannel,
        mediaType: 1,
        showAdAttribution: false
      }
    }
  }, { quoted: fakeQuote })

  await delay(100)
}

handler.help = ['menu']
handler.tags = ['main']
handler.command = ['menu']
handler.register = true

export default handler