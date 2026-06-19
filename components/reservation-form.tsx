"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import type { Product } from "@/lib/types";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { waLink } from "@/lib/whatsapp";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export function ReservationForm({ products }: { products: Product[] }) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = products.find((p) => p.id === productId);

  const waMessage = waLink(
    `Hola, soy ${name || "[nombre]"}. Quiero reservar "${
      selected?.name ?? "un lanzamiento"
    }".${note ? ` Nota: ${note}` : ""}`
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    // Insert público en `reservations` (RLS permite el insert anónimo del
    // formulario; la gestión queda solo para el admin).
    const { error: insertError } = await getSupabaseBrowser()
      .from("reservations")
      .insert({
        product_id: selected?.id ?? null,
        product_name: selected?.name ?? "Lanzamiento",
        customer_name: name.trim(),
        whatsapp: whatsapp.trim(),
        note: note.trim() || null,
      });
    setSaving(false);
    if (insertError) {
      console.error("crear reserva:", insertError.message);
      setError(
        "No se pudo registrar la reserva. Inténtalo de nuevo o escríbenos por WhatsApp."
      );
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="border border-emerald-400/30 bg-emerald-400/5 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
        <h3 className="mt-4 font-display text-2xl font-bold uppercase tracking-tight text-bone">
          ¡Reserva registrada!
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-bone/55">
          Gracias, {name || "comandante"}. Te contactaremos cuando{" "}
          <span className="text-bone">{selected?.name}</span> esté disponible.
          Para confirmar más rápido, escríbenos por WhatsApp.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <WhatsAppButton href={waMessage}>Confirmar por WhatsApp</WhatsAppButton>
          <Button
            variant="ghost"
            type="button"
            onClick={() => {
              setSubmitted(false);
              setName("");
              setWhatsapp("");
              setNote("");
              setError(null);
            }}
          >
            Hacer otra reserva
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-char bg-ink-2 p-6 md:p-8"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nombre" htmlFor="r-name">
          <Input
            id="r-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
          />
        </Field>
        <Field label="WhatsApp" htmlFor="r-wa">
          <Input
            id="r-wa"
            required
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+591 7000 0000"
          />
        </Field>
      </div>

      <Field label="Lanzamiento a reservar" htmlFor="r-prod" className="mt-4">
        <select
          id="r-prod"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="w-full border border-char bg-ink px-4 py-3 font-sans text-sm text-bone focus:border-ember/70 focus:outline-none"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Nota (opcional)" htmlFor="r-note" className="mt-4">
        <Textarea
          id="r-note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="¿Alguna preferencia o pregunta?"
        />
      </Field>

      {error && (
        <p className="mt-4 border border-red-400/30 bg-red-400/5 px-3 py-2 text-center font-mono text-[11px] text-red-400">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="mt-6 w-full" disabled={saving}>
        <Send className="h-4 w-4" />
        {saving ? "Reservando…" : "Reservar lanzamiento"}
      </Button>
      <p className="mt-3 text-center font-mono text-[10px] tracking-[0.1em] text-bone/35">
        Sin compromiso · Te avisamos al WhatsApp cuando llegue
      </p>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-bone/45"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
