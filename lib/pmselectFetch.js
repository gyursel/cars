// Only the dealership's known source may be fetched, including after redirects.
export async function fetchPmselectPage(input) {
  let url = new URL(input);
  for (let redirect = 0; redirect <= 5; redirect++) {
    if (url.protocol !== 'https:' || url.hostname !== 'pmselect.mobile.bg' || url.port || url.username || url.password) {
      throw new Error('Позволени са само HTTPS адреси от pmselect.mobile.bg.');
    }
    const response = await fetch(url.href, {
      headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/152 Safari/537.36',
        'accept-language': 'bg-BG,bg;q=0.9,en;q=0.8'
      },
      redirect: 'manual',
      signal: AbortSignal.timeout(15000)
    });
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;
    const location = response.headers.get('location');
    await response.body?.cancel();
    if (!location) throw new Error('Липсва адрес за пренасочване.');
    url = new URL(location, url);
  }
  throw new Error('Твърде много пренасочвания.');
}
