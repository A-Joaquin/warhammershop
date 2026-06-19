"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ThemeColorMenu } from "@/components/layout/theme-color-menu";
import { CartDrawer } from "@/components/cart/cart-drawer";

/**
 * Envoltura de la vitrina pública. El panel `/admin` trae su propio layout
 * (sidebar, sin cabecera/footer/carrito de tienda), así que aquí ocultamos el
 * chrome público en esas rutas.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <ThemeColorMenu />
      <CartDrawer />
    </>
  );
}
