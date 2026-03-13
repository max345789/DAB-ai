import Link from "next/link";

export const dynamic = "force-static";

export default function MarketingHome() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 py-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          DAB AI
        </h1>
        <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
          An AI marketing agent that helps you capture leads, follow up automatically, and manage
          marketing tasks in one chat.
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/chat"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-5 text-sm font-semibold text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Open DAB AI
        </Link>
        <Link
          href="/signup"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200 dark:hover:bg-zinc-900/40"
        >
          Create account
        </Link>
      </div>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 text-sm text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-200">
        <div className="font-semibold text-zinc-900 dark:text-zinc-50">What it can do</div>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Answer questions about your leads and activity.</li>
          <li>Draft follow-ups and next steps.</li>
          <li>Keep everything in one simple agent chat.</li>
        </ul>
      </section>
    </div>
  );
}

