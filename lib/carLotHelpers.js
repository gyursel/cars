import { supabase } from './supabase';

export async function uploadImage(file) {
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`;

  const { error } = await supabase.storage.from('vehicles').upload(path, file, {
    cacheControl: '3600',
    upsert: false
  });

  if (error) throw new Error(error.message || 'Upload failed');

  const { data } = supabase.storage.from('vehicles').getPublicUrl(path);
  return data.publicUrl;
}

export function isIOSDevice() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
}

export function isStandaloneMode() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export function isVideoUrl(url) {
  if (!url) return false;
  return /\.(mp4|webm|mov)(\?.*)?$/i.test(url) || url.includes('/video/upload/');
}

export function getCarImages(car) {
  const images = Array.isArray(car?.images) ? car.images.filter(Boolean) : [];
  if (car?.image && !images.includes(car.image)) images.unshift(car.image);
  return images.slice(0, 15);
}

export function getBadgeColors(dark) {
  return {
    '4x4': { bg: dark ? '#0a1e2e' : '#DEEBF3', color: dark ? '#50a8c8' : '#0A3550' },
    leasing: { bg: dark ? '#2e2205' : '#FAF0DA', color: dark ? '#e8b830' : '#634806' },
    new: { bg: dark ? '#1a2e0a' : '#EAF3DE', color: dark ? '#7ec850' : '#27500A' },
    warranty: { bg: dark ? '#2e0a0a' : '#FAECE7', color: dark ? '#e86060' : '#712B13' },
  };
}
