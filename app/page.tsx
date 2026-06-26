import { InkCursor } from "@/components/notebook/ink-cursor"
import { Nav } from "@/components/notebook/nav"
import { Header } from "@/components/notebook/header"
import { Current } from "@/components/notebook/current"
import { Research } from "@/components/notebook/research"
import { Projects } from "@/components/notebook/projects"
import { Predictions } from "@/components/notebook/predictions"
import { Notes } from "@/components/notebook/notes"
import { Contact } from "@/components/notebook/contact"

export default function Home() {
  return (
    <div className="notebook-paper min-h-screen">
      <span className="margin-line" aria-hidden="true" />
      <InkCursor />
      <div className="mx-auto w-full max-w-3xl px-6 pl-16 sm:pl-20">
        <Nav />
        <main>
          <Header />
          <Current />
          <Research />
          <Projects />
          <Predictions />
          <Notes />
          <Contact />
        </main>
      </div>
    </div>
  )
}
