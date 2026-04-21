export function Footer() {
  return (
    <footer className="py-8 px-6 text-center">
      <p className="text-sm text-muted-foreground">
        © {new Date().getFullYear()} Alex Chen. Built with Next.js.
      </p>
    </footer>
  )
}
