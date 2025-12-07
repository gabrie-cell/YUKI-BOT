import fetch from 'node-fetch';

const handler = async (m, { conn, text, usedPrefix }) => {
  if (!text) return conn.reply(m.chat, '✳️ Por favor, ingresa un término de búsqueda o el enlace de TikTok.', m);

  const isUrl = /(?:https:?\/{2})?(?:www\.|vm\.|vt\.|t\.)?tiktok\.com\/([^\s&]+)/gi.test(text);

  try {
    await m.react('🕒');

    if (isUrl) {
      const data = await fetchTiktok(text);
      if (!data) return conn.reply(m.chat, '✨ Enlace inválido o sin contenido descargable.', m);

      const { title, duration, author, created_at, type, images, music, play } = data;
      const caption = createCaption(title, author, duration, created_at);

      if (type === 'image' && Array.isArray(images)) {
        const medias = images.map(url => ({ type: 'image', data: { url }, caption }));
        await conn.sendSylphy(m.chat, medias, { quoted: m });
        if (music) {
          await conn.sendMessage(m.chat, { audio: { url: music }, mimetype: 'audio/mp4', fileName: 'tiktok_audio.mp4' }, { quoted: m });
        }
      } else if (play) {
        await conn.sendMessage(m.chat, { video: { url: play }, caption }, { quoted: m });
      } else {
        return conn.reply(m.chat, '✨ No se encontró contenido multimedia para descargar.', m);
      }
    } else {
      const searchRes = await fetch('https://tikwm.com/api/feed/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Cookie': 'current_language=en',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36'
        },
        body: new URLSearchParams({ keywords: text, count: 20, cursor: 0, HD: 1 })
      });
      const json = await searchRes.json();
      const results = json.data?.videos?.filter(v => v.play) || [];

      if (results.length < 2) return conn.reply(m.chat, '✨ Se requieren al menos 2 resultados válidos con contenido.', m);

      const medias = results.slice(0, 10).map(v => ({ type: 'video', data: { url: v.play }, caption: createSearchCaption(v) }));
      await conn.sendSylphy(m.chat, medias, { quoted: m });
    }

    await m.react('✔️');
  } catch (e) {
    await m.react('✖️');
    await conn.reply(m.chat, `Error: Se ha producido un problema.\n> Usa *${usedPrefix}report* para informarlo.\n\n${e.message}`, m);
  }
};

async function fetchTiktok(url) {
  const apis = [
    {
      api: 'TikWM',
      endpoint: `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`,
      extractor: res => res.data
    },
    {
      api: 'Adonix',
      endpoint: `${global.APIs.adonix.url}/download/tiktok?apikey=${global.APIs.adonix.key}&url=${encodeURIComponent(url)}`,
      extractor: res => res.result || res.data
    }
  ];

  const promises = apis.map(async ({ api, endpoint, extractor }) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(endpoint, { signal: controller.signal }).then(r => r.json());
      clearTimeout(timeout);

      const data = extractor(res);
      if (data && (data.play || (data.images && data.images.length))) {
        return data;
      }
      throw new Error('No valid data extracted or media not found');
    } catch (e) {
      throw new Error(`Failed to fetch from ${api}: ${e.message}`);
    }
  });

  try {
    return await Promise.any(promises);
  } catch (e) {
    console.error("All TikTok APIs failed:", e);
    return null;
  }
}

function createCaption(title, author, duration, created_at = '') {
  return `*Título:* \`${title || 'No disponible'}\`\n*Autor:* *${author?.nickname || author?.unique_id || 'No disponible'}*\n*Duración:* *${duration || 'No disponible'}s*${created_at ? `\n*Creado:* ${created_at}` : ''}\n*Música:* [${author?.nickname || author?.unique_id || 'No disponible'}] original sound - ${author?.unique_id || 'unknown'}`;
}

function createSearchCaption(data) {
  return `*Título:* ${data.title || 'No disponible'}\n\n*Autor:* ${data.author?.nickname || 'Desconocido'} ${data.author?.unique_id ? `@${data.author.unique_id}` : ''}\n*Duración:* ${data.duration || 'No disponible'}\n*Música:* ${data.music?.title || `[${data.author?.nickname || 'No disponible'}] original sound - ${data.author?.unique_id || 'unknown'}`}`;
}

handler.help = ['tiktok', 'tt'];
handler.tags = ['downloader'];
handler.command = ['tiktok', 'tt', 'tiktoks', 'tts'];
handler.group = true;

export default handler;
