import Link from "next/link";
import { routes } from "@/lib/site";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="font-display text-5xl font-bold text-pf-orange-bright">404</p>
      <h1 className="mt-2 text-xl font-bold text-white">Sayfa yok</h1>
      <p className="mt-2 text-sm text-zinc-500">Aradığın rota bu statik vitrinde tanımlı değil.</p>
      <Link
        href={routes.home}
        className="mt-6 rounded-full bg-gradient-to-r from-pf-orange to-pink-500 px-6 py-2.5 text-sm font-bold text-black shadow-md"
      >
        Ana sayfa
      </Link>
    </div>
  );
}
