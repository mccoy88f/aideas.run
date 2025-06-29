const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = 4000;

app.use(cors());

app.get('/extract', async (req, res) => {
  const { url, lang = 'it' } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url param' });

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SakaiMetaProxy/1.0)',
        'Accept-Language': `${lang},${lang}-${lang.toUpperCase()};q=0.9,en;q=0.8`
      }
    });
    const html = await response.text();
    const $ = cheerio.load(html);

    const getMeta = (name) =>
      $(`meta[name="${name}"]`).attr('content') ||
      $(`meta[property="${name}"]`).attr('content');

    // Migliore icona
    let icon = $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href');
    if (icon && !icon.startsWith('http')) {
      const base = new URL(url).origin;
      icon = base + (icon.startsWith('/') ? icon : '/' + icon);
    }

    const result = {
      title: $('title').text() || getMeta('og:title') || getMeta('twitter:title'),
      description: getMeta('description') || getMeta('og:description') || getMeta('twitter:description'),
      icon,
      ogImage: getMeta('og:image'),
      ogTitle: getMeta('og:title'),
      ogDescription: getMeta('og:description'),
      keywords: getMeta('keywords'),
      author: getMeta('author')
    };

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Meta proxy listening on http://localhost:${PORT}`);
}); 