import fetch from 'node-fetch';
import cheerio from 'cheerio';

const handler = async (m, { conn, text, usedPrefix }) => {
  if (!text) return m.reply(`✳️ ¿Qué buscas?`);

  try {
    await m.react('🕒');

    if (text.includes("https://")) {
      const result = await downloadFromUrl(text);
      if (!result || !result.download) {
        throw new Error("No se pudo descargar el contenido del enlace.");
      }
      const isVideo = result.download.includes(".mp4");
      await conn.sendMessage(m.chat, {
        [isVideo ? "video" : "image"]: { url: result.download },
        caption: result.title || 'Aquí tienes'
      }, { quoted: m });

    } else {
      const results = await searchPins(text);
      if (!results || !results.length) {
        return conn.reply(m.chat, `✨ No se encontraron resultados para "${text}".`, m);
      }
      const medias = results.slice(0, 10).map(imgUrl => ({ type: 'image', data: { url: imgUrl } }));
      await conn.sendSylphy(m.chat, medias, {
        caption: `*Pinterest - Search*\n\n*Búsqueda:* "${text}"\n*Resultados:* ${medias.length}`,
        quoted: m
      });
    }

    await m.react('✔️');
  } catch (e) {
    await m.react('✖️');
    conn.reply(m.chat, `Error: Se ha producido un problema.\n> Usa *${usedPrefix}report* para informarlo.\n\n` + e.message, m);
  }
};

async function downloadFromUrl(url) {
    const promises = [
        scrapeDl(url),
        apiDl(url)
    ].filter(Boolean);
    try {
        return await Promise.any(promises);
    } catch (e) {
        console.error("All Pinterest download methods failed:", e);
        return null;
    }
}

async function searchPins(query) {
    const promises = [
        scrapeSearch(query),
        apiSearch(query)
    ].filter(Boolean);
    try {
        return await Promise.any(promises);
    } catch (e) {
        console.error("All Pinterest search methods failed:", e);
        return null;
    }
}

async function apiDl(url) {
    try {
        const endpoint = `${global.APIs.adonix.url}/download/pinterest?apikey=${global.APIs.adonix.key}&url=${encodeURIComponent(url)}`;
        const res = await fetch(endpoint).then(r => r.json());
        if (res.status && res.result && res.result.url) {
            return { download: res.result.url, title: res.result.title || 'Pin de Pinterest' };
        }
        throw new Error('Invalid API response from Adonix DL');
    } catch (e) {
        throw new Error(`Adonix API DL failed: ${e.message}`);
    }
}

async function apiSearch(query) {
    try {
        const endpoint = `${global.APIs.adonix.url}/search/pinterest?apikey=${global.APIs.adonix.key}&query=${encodeURIComponent(query)}`;
        const res = await fetch(endpoint).then(r => r.json());
        if (res.status && Array.isArray(res.result) && res.result.length > 0) {
            return res.result;
        }
        throw new Error('Invalid API response from Adonix Search');
    } catch (e) {
        throw new Error(`Adonix API Search failed: ${e.message}`);
    }
}

async function scrapeDl(url) {
    try {
        const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
        const html = await res.text();
        const $ = cheerio.load(html);
        let result;
        const videoSnippet = $('script[data-test-id="video-snippet"]').text();
        if (videoSnippet) {
            const data = JSON.parse(videoSnippet);
            result = { title: data.name, download: data.contentUrl };
        } else {
            const relayResponse = $("script[data-relay-response='true']").eq(0).text();
            const json = JSON.parse(relayResponse);
            const data = json.response.data["v3GetPinQuery"].data;
            result = { title: data.title, download: data.imageLargeUrl };
        }
        if (!result || !result.download) throw new Error("Scraping failed to find download URL.");
        return result;
    } catch (e) {
        throw new Error(`Scrape DL failed: ${e.message}`);
    }
}

async function scrapeSearch(query) {
    try {
        const link = `https://id.pinterest.com/resource/BaseSearchResource/get/?source_url=%2Fsearch%2Fpins%2F%3Fq%3D${encodeURIComponent(query)}%26rs%3Dtyped&data=%7B%22options%22%3A%7B%22query%22%3A%22${encodeURIComponent(query)}%22%2C%22scope%22%3A%22pins%22%7D%2C%22context%22%3A%7B%7D%7D`;
        const res = await fetch(link).then(r => r.json());
        const results = res?.resource_response?.data?.results;
        if (results && results.length > 0) {
            const urls = results.map(item => item?.images?.orig?.url).filter(Boolean);
            if (urls.length > 0) return urls;
        }
        throw new Error("Scraping search failed to find images.");
    } catch (e) {
        throw new Error(`Scrape Search failed: ${e.message}`);
    }
}

handler.help = ['pinterest'];
handler.command = ['pinterest', 'pin'];
handler.tags = ["download"];
handler.group = true;

export default handler;
