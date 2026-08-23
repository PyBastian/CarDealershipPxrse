import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export async function validateAdmin(email: string, password: string) {
  const expectedEmail = process.env.ADMIN_EMAIL;
  const hash = process.env.ADMIN_PASSWORD_HASH;
  return Boolean(expectedEmail && hash && email.toLowerCase() === expectedEmail.toLowerCase() && await bcrypt.compare(password, hash));
}

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/admin/login" },
  providers: [CredentialsProvider({
    name: "Administrador",
    credentials: { email: { label: "Correo", type: "email" }, password: { label: "Contraseña", type: "password" } },
    async authorize(credentials) {
      if (!credentials?.email || !credentials.password || !await validateAdmin(credentials.email, credentials.password)) return null;
      return { id: "admin", name: "Administrador", email: credentials.email };
    }
  })]
};
