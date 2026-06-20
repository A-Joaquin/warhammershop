"use client";

import { AdminAuthProvider } from "@/lib/contexts/admin-auth";
import { AdminStoreProvider } from "@/lib/contexts/admin-store";
import { AdminShell } from "@/components/admin/admin-shell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      <AdminStoreProvider>
        <AdminShell>{children}</AdminShell>
      </AdminStoreProvider>
    </AdminAuthProvider>
  );
}
