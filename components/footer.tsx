export function Footer() {
  return (
    <footer className="relative z-10 py-8 px-6 text-center">
      <p className="text-sm text-muted-foreground">
        © {new Date().getFullYear()} Shlok Channawar. Built with Next.js.
      </p>
    </footer>
  )
}
