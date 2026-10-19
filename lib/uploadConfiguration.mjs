const fallbackUrl = 'https://wyzlvhjdghoiqrymkues.supabase.co';
const failure = (code, error) => ({ code, error });

// Validate locally without contacting storage or returning any credential bytes.
export function uploadConfiguration(env) {
  const url = (env.NEXT_PUBLIC_SUPABASE_URL || fallbackUrl).trim();
  const key = (env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!key) return failure('UPLOAD_KEY_MISSING', 'Качването изисква сървърна настройка SUPABASE_SERVICE_ROLE_KEY или SUPABASE_SECRET_KEY във Vercel.');
  let target;
  try { target = new URL(url); if (target.protocol !== 'https:') throw new Error(); }
  catch { return failure('UPLOAD_URL_INVALID', 'Адресът на Supabase в сървърната настройка не е валиден HTTPS адрес.'); }
  if (key.startsWith('sb_publishable_')) return failure('UPLOAD_KEY_PUBLIC', 'Зададен е публичният Supabase ключ. За качването е нужен частният Secret/service_role ключ от същия Supabase проект.');
  if (!key.startsWith('sb_secret_')) {
    let payload;
    try {
      if (key.split('.').length !== 3) throw new Error();
      payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8'));
    } catch { return failure('UPLOAD_KEY_FORMAT', 'Supabase ключът не е разпознат. Постави реалния Secret/service_role ключ от Supabase; админ паролата и SESSION_SECRET не са подходящи.'); }
    if (payload.role !== 'service_role') return failure('UPLOAD_KEY_PUBLIC', 'Зададен е публичен или потребителски Supabase ключ. За качването е нужен частният Secret/service_role ключ.');
    if (payload.ref && target.hostname.endsWith('.supabase.co') && target.hostname.split('.')[0] !== payload.ref) return failure('UPLOAD_KEY_PROJECT', 'Supabase ключът е от друг проект. Ключът и NEXT_PUBLIC_SUPABASE_URL във Vercel трябва да са за един и същ проект.');
  }
  return { url, key };
}

export function uploadFailure(error) {
  const code = String(error?.code || error?.error || '');
  const message = String(error?.message || '');
  const status = Number(error?.status || error?.statusCode) || 0;
  if (/InvalidApiKey|InvalidJWT|InvalidSignature|AccessDenied/i.test(code) || status === 401 || /invalid (api key|jwt|signature)|jwt (expired|malformed)/i.test(message)) return failure('UPLOAD_KEY_REJECTED', 'Supabase не приема сървърния ключ. Провери дали е валиден Secret/service_role ключ от правилния проект.');
  if (/NoSuchBucket|BucketNotFound/i.test(code) || /bucket.*not found/i.test(message)) return failure('UPLOAD_BUCKET_MISSING', 'В избрания Supabase проект не е намерено хранилището vehicles. Провери дали е избран правилният проект.');
  if (status === 403 || /row.level.security|not authorized|permission denied/i.test(message)) return failure('UPLOAD_ACCESS_DENIED', 'Supabase отказва разрешение за качване. Провери сървърния ключ и достъпа му до хранилището vehicles.');
  if (/fetch|network|timeout|ENOTFOUND|ECONN/i.test(message)) return failure('UPLOAD_CONNECTION_FAILED', 'Сървърът не успя да се свърже със Supabase. Провери адреса на проекта и опитай отново.');
  return failure('UPLOAD_PREPARE_FAILED', 'Supabase не успя да подготви качването. Код: UPLOAD_PREPARE_FAILED.');
}
