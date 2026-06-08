export function Footer() {
  return (
    <footer className="relative border-t border-border py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="font-mono text-xs text-muted-foreground">
          © {new Date().getFullYear()} Shlok Channawar
        </p>
        <p className="font-mono text-xs text-muted-foreground/60">
          Built with Next.js · State College, PA
        </p>
      </div>
    </footer>
  )
}
