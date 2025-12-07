import fetch from 'node-fetch';

const handler = async (m, { args, conn, usedPrefix, command }) => {
  if (!args[0]) {
    return conn.reply(m.chat, `✳️ Por favor, ingresa un enlace de *Instagram* o *Facebook*.`, m);
  }

  await m.react('🕒');

  try {
    const data = await fetchSocialMedia(args[0]);
    if (!data || !data.length) {
      return conn.reply(m.chat, `✨ No se pudo obtener el contenido.`, m);
    }

    for (const media of data) {
      await conn.sendFile(m.chat, media, 'media.mp4', `✳️ Aquí tienes.`, m);
    }
    await m.react('✔️');
  } catch (error) {
    await m.react('✖️');
    await m.reply(m.chat, `Error: Se ha producido un problema.\n> Usa *${usedPrefix}report* para informarlo.\n\n${error.message}`, m);
  }
};

async function fetchSocialMedia(url) {
  const isInstagram = /(instagram\.com)/i.test(url);
  const isFacebook = /(facebook\.com|fb\.watch)/i.test(url);
  const apis = [];

  if (isInstagram) {
    apis.push(
      { api: 'Adonix', endpoint: `${global.APIs.adonix.url}/download/instagram?apikey=${global.APIs.adonix.key}&url=${encodeURIComponent(url)}`, extractor: res => res.data?.map(v => v.url) },
      { api: 'Vreden', endpoint: `${global.APIs.vreden.url}/api/igdownload?url=${encodeURIComponent(url)}`, extractor: res => res.resultado?.respuesta?.datos?.map(v => v.url) },
      { api: 'Delirius', endpoint: `${global.APIs.delirius.url}/download/instagram?url=${encodeURIComponent(url)}`, extractor: res => res.data?.map(v => v.url) }
    );
  }

  if (isFacebook) {
    apis.push(
      { api: 'Adonix', endpoint: `${global.APIs.adonix.url}/download/facebook?apikey=${global.APIs.adonix.key}&url=${encodeURIComponent(url)}`, extractor: res => (res.result?.media?.video_hd ? [res.result.media.video_hd] : null) }
    );
  }

  if (!apis.length) return null;

  const promises = apis.map(async ({ api, endpoint, extractor }) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(endpoint, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`API request failed with status ${res.status}`);
      const json = await res.json();
      const extractedData = extractor(json);
      if (extractedData && extractedData.length) return extractedData;
      throw new Error('No valid data extracted');
    } catch (e) {
      throw new Error(`Failed to fetch from ${api}: ${e.message}`);
    }
  });

  try {
    return await Promise.any(promises);
  } catch (e) {
    console.error("All APIs failed for social media download:", e);
    return null;
  }
}

handler.command = ['instagram', 'ig', 'facebook', 'fb'];
handler.tags = ['descargas'];
handler.help = ['instagram', 'ig', 'facebook', 'fb'];
handler.group = true;

export default handler;
