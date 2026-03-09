import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "OPERATOR", "COURIER"]),
});

export async function GET(): Promise<NextResponse> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.listUsers();
    if (error) throw error;

    type UserRow = typeof data.users[number];
    const users = data.users.map((u: UserRow) => ({
      id: u.id,
      email: u.email ?? "",
      name: (u.user_metadata?.name as string) ?? "",
      role: (u.user_metadata?.role as string) ?? "OPERATOR",
      isActive: !u.banned_until,
      createdAt: u.created_at,
    }));

    return NextResponse.json(users);
  } catch (e) {
    console.error("[GET /api/users]", e);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }

    const { name, email, password, role } = parsed.data;
    const admin = createAdminClient();

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    });

    if (error) {
      if (error.message.includes("already")) {
        return NextResponse.json({ error: "Un utilisateur avec cet email existe déjà" }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({
      id: data.user.id,
      email: data.user.email,
      name,
      role,
      isActive: true,
      createdAt: data.user.created_at,
    }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/users]", e);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
