// Resize only our existing public Supabase assets. Stored URLs remain untouched.
export function vehicleImageSource(source, width) {
  try {
    const url = new URL(source);
    if (url.protocol !== 'https:' || url.hostname !== 'wyzlvhjdghoiqrymkues.supabase.co' || !url.pathname.startsWith('/storage/v1/object/public/')) return source;
    url.pathname = url.pathname.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
    url.searchParams.set('width', String(width));
    url.searchParams.set('quality', '75');
    url.searchParams.set('resize', 'contain');
    return url.href;
  } catch { return source; }
}

export async function decodeVehicleImage(source, width) {
  const optimized = vehicleImageSource(source, width);
  async function decode(url) { const image = new Image(); image.src = url; await image.decode(); return url; }
  try { return await decode(optimized); }
  catch (error) { if (optimized === source) throw error; return decode(source); }
}
