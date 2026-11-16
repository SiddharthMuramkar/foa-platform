// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/9)
import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-2xl font-bold">FOA prototypes</h1>
      <ul className="mt-6 list-disc pl-5">
        <li>
          <Link className="text-primary underline underline-offset-4" href="/prototype/logo-scroll?variant=A">
            #9 Logo scroll interaction
          </Link>
        </li>
      </ul>
    </main>
  );
}
