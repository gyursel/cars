function decodeHtml(value = '') {
  return value
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function plainText(html = '') {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>|<\/div>|<\/li>|<\/tr>|<\/h\d>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function fetchHtml(url) {
  const r = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/152 Safari/537.36',
      'accept-language': 'bg-BG,bg;q=0.9,en;q=0.8'
    },
    redirect: 'follow'
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} при ${url}`);

  const buf = Buffer.from(await r.arrayBuffer());
  const headerCharset = r.headers.get('content-type')?.match(/charset=([\w-]+)/i)?.[1];
  const metaCharset = buf.toString('latin1').match(/<meta[^>]+charset=["']?\s*([\w-]+)/i)?.[1];
  let encoding = (headerCharset || metaCharset || 'utf-8').toLowerCase();
  if (encoding === 'windows1251') encoding = 'windows-1251';

  return { html: (() => { try { return new TextDecoder(encoding).decode(buf); } catch { return buf.toString('utf-8'); } })(), encoding, headerCharset, metaCharset };
}

export default async function handler(req, res) {
  const url = req.query.url || 'https://pmselect.mobile.bg/obiava-11778481183815155-mini-cooper-s-all4-hamann-pop-corn-4x4';
  try {
    const { html, encoding, headerCharset, metaCharset } = await fetchHtml(url);
    const text = plainText(html);

    // Изрежи само частта около "Подробна информация" / техническите данни, за да я огледаме.
    const idx = text.search(/Дата на производство/i);
    const around = idx >= 0 ? text.slice(idx, idx + 1200) : '(не е намерен маркерът "Дата на производство" в декодирания текст)';

    // Суровият HTML около същия маркер, за да видим реалната markup структура.
    const rawIdx = html.search(/Дата на производство/i);
    const rawAround = rawIdx >= 0 ? html.slice(Math.max(0, rawIdx - 200), rawIdx + 2500) : '(маркерът не е намерен в суровия HTML)';

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      detectedEncoding: encoding,
      headerCharset,
      metaCharset,
      textLength: text.length,
      containsCyrillicLabel: idx >= 0,
      sampleAroundLabel: around,
      rawHtmlAroundLabel: rawAround,
      first500: text.slice(0, 500)
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
