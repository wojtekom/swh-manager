export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Minimalny layout bez nawigacji — do iframe
  return <>{children}</>;
}
