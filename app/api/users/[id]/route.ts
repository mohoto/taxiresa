import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(["ADMIN", "OPERATOR", "COURIER"]).optional(),
  isActive: z.boolean().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body: unknown = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const admin = createAdminClient();
    const updates: Record<string, unknown> = {};

    if (parsed.data.name !== undefined || parsed.data.role !== undefined) {
      // Fetch current metadata first
      const { data: existing } = await admin.auth.admin.getUserById(id);
      const currentMeta = existing?.user?.user_metadata ?? {};
      updates.user_metadata = {
        ...currentMeta,
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.role !== undefined && { role: parsed.data.role }),
      };
    }

    if (parsed.data.isActive !== undefined) {
      updates.ban_duration = parsed.data.isActive ? "none" : "876000h";
    }

    const { data, error } = await admin.auth.admin.updateUserById(id, updates);
    if (error) throw error;

    return NextResponse.json({
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name ?? "",
      role: data.user.user_metadata?.role ?? "OPERATOR",
      isActive: !data.user.banned_until,
      createdAt: data.user.created_at,
    });
  } catch (e) {
    console.error("[PATCH /api/users/:id]", e);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { id } = await params;
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/users/:id]", e);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
