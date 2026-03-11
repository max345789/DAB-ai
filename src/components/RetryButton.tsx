"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type Props = {
  label?: string;
  onRetry?: () => void;
};

export function RetryButton({ label = "Retry", onRetry }: Props) {
  const router = useRouter();

  function handleClick() {
    if (onRetry) {
      onRetry();
      return;
    }
    router.refresh();
  }

  return (
    <Button type="button" variant="secondary" onClick={handleClick}>
      {label}
    </Button>
  );
}
