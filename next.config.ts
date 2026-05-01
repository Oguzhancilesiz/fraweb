import type { NextConfig } from "next";

/**
 * `turbopack.root` = sadece `web` vermeyin: npm workspaces ile `next` kök `node_modules`'a
 * hoist olur; Turbopack `web` dışına çıkamayınca `next/package.json` bulunamıyor (Turbopack hatası).
 * Tailwind / Next çözümü kök lockfile + hoist ile zaten kökte.
 */
function storageRemotePatterns(): { protocol: "http" | "https"; hostname: string; pathname: string; port?: string }[] {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  try {
    const u = new URL(raw || "http://localhost:5289");
    const protocol: "http" | "https" = u.protocol === "https:" ? "https" : "http";
    const base = { protocol, hostname: u.hostname, pathname: "/storage/**" as const };
    return u.port ? [{ ...base, port: u.port }] : [base];
  } catch {
    return [{ protocol: "http", hostname: "localhost", port: "5289", pathname: "/storage/**" }];
  }
}

const nextConfig: NextConfig = {
  reactCompiler: true,
  /** Plesk / VPS: `next start` yerine `.next/standalone` + Node. `npm run build:production` sonrası deploy. */
  output: "standalone",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com", pathname: "/**" }, ...storageRemotePatterns()],
  },
};

export default nextConfig;
