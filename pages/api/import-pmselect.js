const BASE = 'https://pmselect.mobile.bg/';

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

function uniq(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function cleanUrl(url) {
  return decodeHtml(url).replace(/\\\//g, '/');
}

function findValue(text, label, nextLabels) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const next = nextLabels.map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  // Забележка: \b (word boundary) в JS regex разпознава само ASCII букви/цифри
  // като "word char" – с кирилица никога не съвпада, затова lookahead-ът по-долу
  // не използва \b, а изрично проверява, че след етикета НЕ следва буква/цифра
  // (кирилска или латинска), което върши същата работа и с кирилица.
  const re = new RegExp(`${escaped}\\s*\\n?\\s*([^\\n]+?)(?=\\n\\s*(?:${next})(?![a-zA-Zа-яА-ЯёЁ0-9])|$)`, 'i');
  const m = text.match(re);
  return m ? m[1].trim() : '';
}

function normalizePrice(s = '') {
  return s.replace(/[^0-9]/g, '');
}

function capitalizeFirst(s = '') {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function formatThousands(numStr = '') {
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// "3000 см 3" идва от "3000 см<sup>3</sup>" след като tag-овете се махат
// (превръщат се в интервал) – нормализираме го до "3000 см³".
function cleanDisplacement(s = '') {
  return s
    .replace(/см\s*3\b/i, 'см³')
    .replace(/\s+/g, ' ')
    .trim();
}

// "240000 км" -> "240 000 км", за да съвпада с формàта на предложенията.
function cleanMileage(s = '') {
  const m = s.match(/(\d[\d\s]*)\s*км/i);
  if (!m) return s.trim();
  const num = m[1].replace(/\s+/g, '');
  return `${formatThousands(num)} км`;
}

// Полето "Двигател" на mobile.bg всъщност е типът гориво в прилагателна форма
// (Дизелов/Бензинов...). Формата за "Гориво" в приложението иска съществително
// (Дизел/Бензин...), затова превеждаме, вместо просто да дублираме суровия текст.
const FUEL_FROM_ENGINE = {
  'дизелов': 'Дизел',
  'бензинов': 'Бензин',
  'хибриден': 'Хибрид',
  'бензинов хибриден': 'Бензин хибрид',
  'дизелов хибриден': 'Дизел хибрид',
  'plug-in хибриден': 'Plug-in хибрид',
  'електрически': 'Електричество',
  'газов': 'Газ/Бензин',
  'метанов': 'Метан/Бензин'
};
function fuelFromEngine(engine = '') {
  return FUEL_FROM_ENGINE[engine.trim().toLowerCase()] || engine;
}

function yearFromProduction(s = '') {
  const m = s.match(/(19|20)\d{2}/);
  return m ? m[0] : '';
}

function badgesFromText(text) {
  const badges = [];
  if (/\b4x4\b|4MATIC|quattro|ALL4/i.test(text)) badges.push('4x4');
  if (/лизинг|бартер/i.test(text)) badges.push('leasing');
  if (/гаранц/i.test(text)) badges.push('warranty');
  return badges;
}

function sectionFor(category = '') {
  const c = category.toLowerCase();
  if (c.includes('джип') || c.includes('suv')) return 'Джипове / SUV';
  if (c.includes('купе') || c.includes('хеч')) return 'Купета / Хечбек';
  return 'Седани';
}

function trimMobileBoilerplate(value = '') {
  return value
    .replace(/\n?Повече детайли и \d+ снимки[\s\S]*$/i, '')
    .replace(/\n?Добави в бележника[\s\S]*$/i, '')
    .replace(/\n?Маркирай обявата[\s\S]*$/i, '')
    .replace(/\n?Контакти (?:с|на) продавача[\s\S]*$/i, '')
    .replace(/\n?Покажи местоположението на картата[\s\S]*$/i, '')
    .replace(/\n?Сподели:[\s\S]*$/i, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractFullDescription(text = '') {
  const lower = text.toLowerCase();
  const heading = 'допълнителна информация';
  let start = lower.indexOf(heading);

  // Най-надеждният вариант е секцията „Допълнителна информация“.
  if (start >= 0) {
    let part = text.slice(start + heading.length);
    const stops = [
      '\nОсобености', '\nКонтакти с продавача', '\nКонтакти на продавача',
      '\nВиж всички обяви', '\nСподели:', '\nМаркирай обявата'
    ];
    let end = part.length;
    for (const stop of stops) {
      const i = part.toLowerCase().indexOf(stop.toLowerCase());
      if (i >= 0 && i < end) end = i;
    }
    const cleaned = trimMobileBoilerplate(part.slice(0, end));
    if (cleaned.length > 20) return cleaned;
  }

  // При някои Mobile.bg шаблони заглавието на секцията не присъства в plain text.
  // В този случай взимаме текста след техническите данни до „Особености/Контакти“.
  const technicalAnchors = ['Цвят', 'Пробег [км]', 'Категория', 'Скоростна кутия'];
  let anchorPos = -1;
  for (const a of technicalAnchors) {
    const pos = text.lastIndexOf(a);
    if (pos > anchorPos) anchorPos = pos;
  }
  if (anchorPos >= 0) {
    const tail = text.slice(anchorPos);
    const nl1 = tail.indexOf('\n');
    const nl2 = nl1 >= 0 ? tail.indexOf('\n', nl1 + 1) : -1;
    let part = nl2 >= 0 ? tail.slice(nl2 + 1) : tail;
    const stops = ['\nОсобености', '\nКонтакти с продавача', '\nКонтакти на продавача', '\nВиж всички обяви', '\nСподели:'];
    let end = part.length;
    for (const stop of stops) {
      const i = part.toLowerCase().indexOf(stop.toLowerCase());
      if (i >= 0 && i < end) end = i;
    }
    const cleaned = trimMobileBoilerplate(part.slice(0, end));
    if (cleaned.length > 20) return cleaned;
  }

  return '';
}

function extractFeatures(text = '') {
  const m = text.match(/(?:^|\n)Особености\s*-?\s*([\s\S]*?)(?=\n(?:Контакти (?:с|на) продавача|Виж всички обяви|Сподели:|Повече детайли)|$)/i);
  if (!m) return '';
  return trimMobileBoilerplate(m[1])
    .replace(/\s*\\\s*/g, ', ')
    .replace(/\s*,\s*/g, ', ')
    .trim();
}

function extractDetail(html, sourceUrl) {
  const text = plainText(html);
  const lines = text.split('\n').map(x => x.trim()).filter(Boolean);

  let title = '';
  const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i)?.[1];
  if (ogTitle) {
    title = decodeHtml(ogTitle)
      .replace(/\s*[-|].*Mobile\.bg.*$/i, '')
      .replace(/\s*[|:]?\s*(?:№|No\.?)?\s*\d{10,}\s*$/i, '')
      .trim();
  }
  if (!title) {
    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
    title = h1 ? plainText(h1) : '';
  }
  if (!title) {
    const idx = lines.findIndex(x => /^\d[\d\s]*\s*€/.test(x));
    if (idx > 0) title = lines[idx - 1];
  }

  const labels = ['Дата на производство','Двигател','Мощност','Евростандарт','Кубатура [куб.см]','Скоростна кутия','Категория','Пробег [км]','Цвят','Безопасност','Други','Екстериор','Защита','Интериор','Комфорт','Допълнителна информация'];
  const productionDate = capitalizeFirst(findValue(text, 'Дата на производство', labels.slice(1)));
  const engine = findValue(text, 'Двигател', labels.slice(2));
  const power = findValue(text, 'Мощност', labels.slice(3));
  const euroStandard = findValue(text, 'Евростандарт', labels.slice(4));
  const displacement = cleanDisplacement(findValue(text, 'Кубатура [куб.см]', labels.slice(5)));
  const gearbox = findValue(text, 'Скоростна кутия', labels.slice(6));
  const category = findValue(text, 'Категория', labels.slice(7));
  const mileage = cleanMileage(findValue(text, 'Пробег [км]', labels.slice(8)));
  const color = findValue(text, 'Цвят', labels.slice(9));
  const fuel = fuelFromEngine(engine);

  // Пълното описание от обявата – без съкращаване.
  let additionalInfo = extractFullDescription(text);
  const features = extractFeatures(text);
  if (features) {
    additionalInfo = [additionalInfo, `ОСОБЕНОСТИ:\n${features}`].filter(Boolean).join('\n\n');
  }

  const priceMatches = [...text.matchAll(/(?:^|\n)\s*([0-9][0-9\s]{2,})\s*€/g)].map(m => m[1]);
  const price = normalizePrice(priceMatches[0] || '');

  const imageMatches = [...html.matchAll(/https?:\\?\/\\?\/[a-z0-9.-]*mobistatic[a-z0-9.-]*\.focus\.bg[^"'<>\s)]+/gi)].map(m => cleanUrl(m[0]));
  let images = uniq(imageMatches.filter(u => /\/big1\//i.test(u) && /\.(?:webp|jpe?g|png)(?:\?|$)/i.test(u))).slice(0, 15);
  if (!images.length) {
    images = uniq(imageMatches.filter(u => /\.(?:webp|jpe?g|png)(?:\?|$)/i.test(u) && !/small|thumb/i.test(u))).slice(0, 15);
  }

  const desc = additionalInfo ? additionalInfo.replace(/\s+/g, ' ').slice(0, 240).trim() : '';
  const badges = badgesFromText(text);
  const year = yearFromProduction(productionDate);

  return {
    name: title || 'Автомобил',
    desc,
    price,
    year,
    productionDate,
    mileage,
    fuel,
    engine,
    power,
    euroStandard,
    displacement,
    gearbox,
    color,
    additionalInfo,
    badges,
    image: images[0] || '',
    images,
    sourceUrl,
    sourceCategory: category,
    _section: sectionFor(category)
  };
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

  // response.text() винаги декодира като UTF-8, независимо от реалния charset.
  // pmselect.mobile.bg сервира windows-1251, затова четем суровите байтове
  // и декодираме с реално декларирания charset (от header или <meta>).
  const buf = Buffer.from(await r.arrayBuffer());
  const headerCharset = r.headers.get('content-type')?.match(/charset=([\w-]+)/i)?.[1];
  const metaCharset = buf.toString('latin1').match(/<meta[^>]+charset=["']?\s*([\w-]+)/i)?.[1];
  let encoding = (headerCharset || metaCharset || 'utf-8').toLowerCase();
  if (encoding === 'windows1251') encoding = 'windows-1251';

  try {
    return new TextDecoder(encoding).decode(buf);
  } catch {
    return buf.toString('utf-8');
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const overview = await fetchHtml(BASE);
    const hrefs = uniq(
      [...overview.matchAll(/href=["']([^"']*\/obiava-[^"']+)["']/gi)]
        .map(m => new URL(decodeHtml(m[1]), BASE).href)
    ).slice(0, 80);

    if (!hrefs.length) throw new Error('Не бяха открити обяви в PM Select.');

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    const cars = [];
    for (const url of hrefs) {
      try {
        const html = await fetchHtml(url);
        const car = extractDetail(html, url);
        if (car.name && !cars.some(c => c.sourceUrl === car.sourceUrl)) cars.push(car);
      } catch (e) {
        console.error('Import detail failed:', url, e);
      }
      await sleep(200);
    }

    if (!cars.length) throw new Error('Не беше прочетена нито една обява.');

    const order = ['Джипове / SUV', 'Седани', 'Купета / Хечбек'];
    const sections = order
      .map(label => ({ label, cars: cars.filter(c => c._section === label).map(({_section, sourceCategory, ...c}) => c) }))
      .filter(s => s.cars.length);

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      dealershipName: 'PM SELECT AUTOMOTIVE',
      phone: '+359 899 225 640',
      count: cars.length,
      sections
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Import failed' });
  }
}
