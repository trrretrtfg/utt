import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { LIMITS } from '../constants/config';
import { requestUploadUrls, registerUploadedMedia } from './api';

export async function pickImages(max = LIMITS.maxImages) {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return { denied: true, assets: [] };
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    selectionLimit: max,
    orderedSelection: true,
    quality: 1,
  });
  if (result.canceled) return { denied: false, assets: [] };
  return { denied: false, assets: result.assets.slice(0, max) };
}

async function resized(uri, sourceWidth, sourceHeight, longSide, quality) {
  const actions = [];
  if (sourceWidth && sourceHeight && Math.max(sourceWidth, sourceHeight) > longSide) {
    actions.push(sourceWidth >= sourceHeight
      ? { resize: { width: longSide } }
      : { resize: { height: longSide } });
  }
  return ImageManipulator.manipulateAsync(uri, actions, {
    compress: quality,
    format: ImageManipulator.SaveFormat.JPEG,
  });
}

async function uploadToCloudinary(uri, authorization) {
  const form = new FormData();
  form.append('file', { uri, name: 'zikra-memory.jpg', type: 'image/jpeg' });
  form.append('api_key', String(authorization.api_key));
  form.append('timestamp', String(authorization.timestamp));
  form.append('signature', authorization.signature);
  form.append('public_id', authorization.public_id);
  form.append('asset_folder', authorization.asset_folder);
  form.append('overwrite', 'false');
  form.append('type', 'authenticated');
  form.append('upload_preset', authorization.upload_preset);

  const response = await fetch(authorization.upload_url, { method: 'POST', body: form });
  const result = await response.json();
  if (!response.ok) throw new Error(result?.error?.message || 'تعذّر رفع الصورة إلى التخزين الآمن.');
  return result;
}

// يضغط الصورة محلياً ثم يرفعها مباشرة إلى Cloudinary، وبعد التحقق منها تُسجّل بياناتها فقط في Supabase.
export async function uploadMemoryImages(memoryId, assets, onProgress) {
  if (!assets?.length) throw new Error('أضف صورة واحدة على الأقل.');
  if (assets.length > LIMITS.maxImages) throw new Error('الحد الأقصى ١٠ صور للذكرى الواحدة.');

  let completed = 0;
  for (let index = 0; index < assets.length; index += 1) {
    const asset = assets[index];
    const full = await resized(asset.uri, asset.width, asset.height, 2200, 0.88);
    const authorization = await requestUploadUrls(memoryId);
    const uploaded = await uploadToCloudinary(full.uri, authorization);
    await registerUploadedMedia(memoryId, uploaded, index);
    completed += 1;
    if (onProgress) onProgress(completed, assets.length);
  }
}
