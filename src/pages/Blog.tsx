import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import Layout from "@/components/Layout";
import { useBlogPosts } from "@/hooks/useDatabase";
import { resolveDestinationName } from "@/lib/cms";

export default function BlogPage() {
  const { posts, loading } = useBlogPosts();

  return (
    <Layout>
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground">Travel Blog</h1>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">Stories, guides, and updates published directly from the admin panel.</p>
          </motion.div>
          {loading ? (
            <p className="text-center text-muted-foreground py-12">Loading...</p>
          ) : posts.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No published blog posts yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {posts.map((post, index) => (
                <motion.div key={post.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}>
                  <Link to={`/blog/${post.slug}`} className="group block rounded-2xl bg-card shadow-elegant overflow-hidden hover:shadow-card-hover transition-all duration-300">
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={post.image || post.blog_media.find((item) => item.type === "image")?.url || "/placeholder.svg"}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      </div>
                    <div className="p-6">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        <span className="font-semibold text-primary uppercase tracking-wider">{resolveDestinationName(post.destination_record, post.destination) || "Travel"}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
                        </span>
                      </div>
                      <h2 className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors">{post.title}</h2>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
