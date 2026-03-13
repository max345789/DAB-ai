"use client";

type Props = {
  label?: string;
  className?: string;
};

export function PandaWalk({ label = "DAB AI is working", className }: Props) {
  return (
    <div className={["inline-flex items-center gap-3", className].filter(Boolean).join(" ")}>
      <span className="sr-only">{label}</span>
      <div className="relative h-5 w-24 overflow-hidden rounded-full border border-zinc-200 bg-white/70 dark:border-zinc-800 dark:bg-zinc-950/30">
        <div className="absolute inset-y-0 left-2 right-2 my-auto h-px bg-zinc-200/80 dark:bg-zinc-800/80" />
        <div className="dab-panda-walk absolute left-0 top-0 h-5 w-5">
          <svg viewBox="0 0 24 24" className="h-5 w-5">
            <circle cx="12" cy="12" r="7.5" className="fill-white dark:fill-zinc-100" />
            <circle cx="8.6" cy="10.6" r="2.2" className="fill-zinc-900" />
            <circle cx="15.4" cy="10.6" r="2.2" className="fill-zinc-900" />
            <circle cx="10.2" cy="12.2" r="1" className="fill-zinc-100 dark:fill-zinc-950" />
            <circle cx="13.8" cy="12.2" r="1" className="fill-zinc-100 dark:fill-zinc-950" />
            <path
              d="M11 15.2c.7.5 1.3.5 2 0"
              className="fill-none stroke-zinc-900"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <circle cx="6.9" cy="7.8" r="2.1" className="fill-zinc-900" />
            <circle cx="17.1" cy="7.8" r="2.1" className="fill-zinc-900" />
          </svg>
        </div>
      </div>
      <div className="inline-flex items-center gap-1 text-xs text-zinc-500">
        <span>Typing</span>
        <span className="dab-typing-dot">.</span>
        <span className="dab-typing-dot dab-typing-dot-2">.</span>
        <span className="dab-typing-dot dab-typing-dot-3">.</span>
      </div>
    </div>
  );
}

