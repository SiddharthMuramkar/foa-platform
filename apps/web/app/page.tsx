// PROTOTYPE — throwaway, never merge (https://github.com/SiddharthMuramkar/foa-platform/issues/8)
import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-xl p-6 font-sans">
      <h1 className="text-xl font-bold">FOA prototypes</h1>
      <ul className="mt-4 list-disc pl-6">
        <li>
          <Link className="underline" href="/prototype/visual-direction?variant=A">
            Visual direction: joyful but trustworthy (#8)
          </Link>
        </li>
      </ul>
    </main>
  );
}
