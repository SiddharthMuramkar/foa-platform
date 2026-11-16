// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/13)
import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-2xl font-bold">FOA prototypes</h1>
      <p className="mt-2 text-bk-muted">Throwaway prototypes. Never merge.</p>
      <ul className="mt-6 list-disc pl-5">
        <li>
          <Link className="text-bk-primary underline underline-offset-4" href="/prototype/brand-kit?variant=A">
            Brand kit: icons, OG card, watermark and stamp (#13)
          </Link>
        </li>
      </ul>
    </main>
  );
}
