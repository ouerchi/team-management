import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = { title: "Team Directory", description: "A simple user and project manager." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en">
      <body>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
            <Link href="/users" className="text-lg font-bold tracking-tight">Team Directory<span className="text-indigo-600"></span></Link>
            <nav aria-label="Main navigation" className="flex gap-6 text-sm font-medium">
              <Link href="/users" className="hover:text-indigo-600">Users</Link>
              <Link href="/projects" className="hover:text-indigo-600">Projects</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
    </body>
  </html>;
}
