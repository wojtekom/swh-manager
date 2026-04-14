import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

// Demo accounts for local preview (when no database is available)
const DEMO_ACCOUNTS = [
  { id: "demo-admin", email: "admin@swh.pl", password: "Admin123!", name: "Administrator SWH", role: "ADMIN" },
  { id: "demo-coach", email: "trener@swh.pl", password: "Trener123!", name: "Jan Kowalski (Trener)", role: "COACH" },
  { id: "demo-parent", email: "rodzic@swh.pl", password: "Rodzic123!", name: "Anna Nowak (Rodzic)", role: "PARENT" },
];

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Hasło", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Podaj email i hasło");
        }

        // Try database first
        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (user && user.active) {
            const isValid = await bcrypt.compare(
              credentials.password,
              user.passwordHash
            );

            if (isValid) {
              return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
              };
            }
          }
        } catch {
          // Database not available — fall through to demo mode
          console.log("⚡ Baza niedostępna — tryb demo");
        }

        // Demo mode fallback
        const demo = DEMO_ACCOUNTS.find(
          (a) => a.email === credentials.email && a.password === credentials.password
        );

        if (demo) {
          return { id: demo.id, email: demo.email, name: demo.name, role: demo.role };
        }

        throw new Error("Nieprawidłowy email lub hasło");
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};
