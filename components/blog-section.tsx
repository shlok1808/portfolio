import { ArrowRight } from "lucide-react"

interface BlogPost {
  title: string
  excerpt: string
  date: string
  slug: string
}

const blogPosts: BlogPost[] = [
  {
    title: "Why I Think Sparse Autoencoders Are Underrated",
    excerpt: "A deep dive into why SAEs might be one of the most promising directions for mechanistic interpretability, and some thoughts on scaling them up.",
    date: "Mar 2024",
    slug: "sparse-autoencoders-underrated",
  },
  {
    title: "Notes on Anthropic's Circuit Analysis Paper",
    excerpt: "Breaking down the key contributions and what they mean for the field. Plus some speculative takes on where this research direction could go next.",
    date: "Feb 2024",
    slug: "anthropic-circuit-analysis",
  },
  {
    title: "What I Learned from 6 Months of Interpretability Research",
    excerpt: "Honest reflections on what worked, what didn't, and the surprising things nobody told me before I started.",
    date: "Jan 2024",
    slug: "six-months-interp",
  },
]

function BlogCard({ post }: { post: BlogPost }) {
  return (
    <article className="group p-5 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-[0_4px_20px_rgba(218,119,86,0.12)] transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-center gap-2 mb-3">
        <time className="text-xs text-muted-foreground">{post.date}</time>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
        {post.title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        {post.excerpt}
      </p>
      <a
        href={`/blog/${post.slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline underline-offset-2"
      >
        Read more
        <ArrowRight className="w-3.5 h-3.5" />
      </a>
    </article>
  )
}

export function BlogSection() {
  return (
    <section id="blog" className="py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-foreground mb-8">Blog</h2>
        <div className="grid gap-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin">
          {blogPosts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </div>
    </section>
  )
}
