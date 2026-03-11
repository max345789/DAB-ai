import { Suspense } from "react";

import { ResetPasswordClient } from "@/app/reset-password/ResetPasswordClient";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-white/10 bg-white/40 p-6 text-sm text-slate-500 dark:bg-white/5">
          Loading reset flow...
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}

