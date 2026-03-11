import { RetryButton } from "@/components/RetryButton";

type Props = {
  title: string;
  message: string;
  onRetry?: () => void;
};

export function ApiErrorState({ title, message, onRetry }: Props) {
  return (
    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-100">
      <p className="text-base font-semibold">{title}</p>
      <p className="mt-2 text-sm text-rose-100/80">{message}</p>
      <div className="mt-4">
        <RetryButton onRetry={onRetry} />
      </div>
    </div>
  );
}
