/**
 * Compresión + subida de imágenes de producto a Supabase Storage.
 *
 * El admin "sube un archivo" → lo comprimimos en el navegador (canvas, sin
 * librerías) redimensionando y recodificando a WebP, y subimos el resultado al
 * bucket `product-images`. Guardamos solo la URL pública (corta), nunca el
 * base64 en la base. Así una foto de 6 MB queda en ~100–300 KB.
 */
import { getSupabaseBrowser } from "./supabase/client";

const BUCKET = "product-images";

/** Comprime/redimensiona una imagen en el navegador (canvas → WebP). */
export async function compressImage(
  file: File,
  { maxDim = 1600, quality = 0.8 }: { maxDim?: number; quality?: number } = {}
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close?.();
    throw new Error("No se pudo procesar la imagen.");
  }
  // Fondo blanco por si la original tiene transparencia.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/webp", quality)
  );
  if (!blob) throw new Error("No se pudo comprimir la imagen.");
  return blob;
}

/** Comprime y sube a Storage; devuelve la URL pública. */
export async function uploadProductImage(file: File): Promise<string> {
  const blob = await compressImage(file);
  const sb = getSupabaseBrowser();
  const path = `${crypto.randomUUID()}.webp`;
  const { error } = await sb.storage.from(BUCKET).upload(path, blob, {
    contentType: "image/webp",
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
