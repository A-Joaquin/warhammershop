"use client";

import { useState } from "react";
import { ImagePlus, Trash2, Upload, ChevronUp, ChevronDown } from "lucide-react";
import type { ProductImage } from "@/lib/types";
import { uploadProductImage } from "@/lib/images";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/admin/form-fields";

/** Imágenes placeholder ya disponibles en /public/products para elegir rápido. */
const QUICK_IMAGES = Array.from({ length: 7 }, (_, i) => `/products/bt-0${i + 1}.jpg`);

/**
 * Editor de imágenes del producto (controlado): subir (comprimidas a WebP),
 * elegir placeholders, reordenar (la 1ª = portada), editar alt/tipo y quitar.
 * La lista que recibe = el orden en que las verá el cliente.
 */
export function ImageEditor({
  images,
  onChange,
  altFallback = "Imagen de producto",
  onUploadingChange,
}: {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
  altFallback?: string;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const setUp = (b: boolean) => {
    setUploading(b);
    onUploadingChange?.(b);
  };

  const addImage = (img: ProductImage) => onChange([...images, img]);
  const updateImage = (idx: number, patch: Partial<ProductImage>) =>
    onChange(images.map((im, i) => (i === idx ? { ...im, ...patch } : im)));
  const removeImage = (idx: number) =>
    onChange(images.filter((_, i) => i !== idx));

  // Reordena: el orden de la lista = el orden en que el cliente verá las fotos.
  const moveImage = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= images.length) return;
    const copy = [...images];
    [copy[idx], copy[j]] = [copy[j], copy[idx]];
    onChange(copy);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setUp(true);
    setUploadCount(files.length);
    setError(null);

    // Comprime (WebP) y sube todas en paralelo; un fallo no corta a las demás.
    const results = await Promise.allSettled(
      files.map(async (file) => ({
        url: await uploadProductImage(file),
        alt: file.name,
      }))
    );
    const next = [...images];
    let failed = 0;
    for (const r of results) {
      if (r.status === "fulfilled") {
        next.push({ url: r.value.url, kind: "store", alt: r.value.alt });
      } else {
        failed++;
      }
    }
    onChange(next);
    if (failed > 0) {
      setError(`No se pudieron subir ${failed} de ${files.length} imágenes.`);
    }
    setUp(false);
    setUploadCount(0);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-bone/45">
          Imágenes ({images.length})
        </span>
        <label
          className={cn(
            "inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors",
            uploading
              ? "cursor-wait text-ember"
              : "cursor-pointer text-bone/55 hover:text-ember"
          )}
        >
          <Upload className={cn("h-3.5 w-3.5", uploading && "animate-pulse")} />
          {uploading
            ? `Subiendo ${uploadCount} ${uploadCount === 1 ? "foto" : "fotos"}…`
            : "Subir fotos (varias)"}
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={uploading}
            onChange={onFile}
            className="hidden"
          />
        </label>
      </div>

      {/* Selección rápida de placeholders */}
      <div className="mt-2 flex flex-wrap gap-2">
        {QUICK_IMAGES.map((url) => (
          <button
            key={url}
            type="button"
            onClick={() => addImage({ url, kind: "official", alt: altFallback })}
            title={`Añadir ${url}`}
            className="inline-flex h-7 items-center gap-1 border border-char bg-ink px-2 font-mono text-[10px] text-bone/60 transition-colors hover:border-ember hover:text-ember"
          >
            <ImagePlus className="h-3 w-3" />
            {url.replace("/products/", "")}
          </button>
        ))}
      </div>

      {images.length > 1 && (
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-bone/35">
          La 1ª imagen es la portada. Usa ↑ ↓ para ordenar cómo las verá el cliente.
        </p>
      )}

      <div className="mt-3 flex flex-col gap-2">
        {images.map((im, idx) => (
          <div key={idx} className="flex items-center gap-2 border border-char bg-ink p-2">
            {/* Reordenar */}
            <div className="flex shrink-0 flex-col">
              <button
                type="button"
                onClick={() => moveImage(idx, -1)}
                disabled={idx === 0}
                aria-label="Subir imagen"
                className="text-bone/45 transition-colors hover:text-ember disabled:cursor-not-allowed disabled:opacity-25"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => moveImage(idx, 1)}
                disabled={idx === images.length - 1}
                aria-label="Bajar imagen"
                className="text-bone/45 transition-colors hover:text-ember disabled:cursor-not-allowed disabled:opacity-25"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {/* Miniatura + badge de portada */}
            <div className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={im.url}
                alt={im.alt}
                className="h-12 w-12 border border-char object-cover"
              />
              {idx === 0 && (
                <span className="absolute -top-1.5 -left-1.5 bg-ember px-1 font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-ink">
                  Portada
                </span>
              )}
            </div>

            <div className="grid min-w-0 flex-1 grid-cols-1 gap-1.5 sm:grid-cols-[1fr_120px]">
              <Input
                value={im.alt}
                onChange={(e) => updateImage(idx, { alt: e.target.value })}
                placeholder="Texto alternativo"
                className="py-1.5 text-xs"
              />
              <Select
                value={im.kind}
                onChange={(e) => updateImage(idx, { kind: e.target.value as ProductImage["kind"] })}
                className="py-1.5 text-xs"
              >
                <option value="official">Oficial</option>
                <option value="store">De tienda</option>
              </Select>
            </div>
            <button
              type="button"
              onClick={() => removeImage(idx)}
              aria-label="Quitar imagen"
              className="shrink-0 text-bone/40 transition-colors hover:text-ember"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {images.length === 0 && (
          <p className="border border-dashed border-char px-3 py-4 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-bone/30">
            Sin imágenes. Usa las de muestra o sube un archivo.
          </p>
        )}
      </div>

      {error && <p className="mt-2 font-mono text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
