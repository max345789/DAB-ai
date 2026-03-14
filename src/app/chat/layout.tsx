export default function ChatLayout({ children }: { children: React.ReactNode }) {
  // Chat should behave like a single-screen app:
  // messages scroll, composer stays pinned, no page-level scrolling.
  return (
    <div className="-mx-4 -my-6 h-full overflow-hidden sm:-mx-6 sm:-my-6">
      {children}
    </div>
  );
}

