export default function ChatLayout({ children }: { children: React.ReactNode }) {
  // Chat should behave like a single-screen app:
  // messages scroll, composer stays pinned, no page-level scrolling.
  return children;
}
