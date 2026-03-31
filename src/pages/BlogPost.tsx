import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar } from "lucide-react";
import Layout from "@/components/Layout";
import { useBlogPostBySlug } from "@/hooks/useDatabase";
import { resolveDestinationName } from "@/lib/cms";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { post, loading } = useBlogPostBySlug(slug);

  if (loading) {
    return <Layout><div className="container mx-auto px-4 py-20 text-center"><p className="text-muted-foreground">Loading...</p></div></Layout>;
  }

  if (!post) {
    return <Layout><div className="container mx-auto px-4 py-20 text-center"><h1 className="text-2xl font-display font-bold">Post not found</h1></div></Layout>;
  }

  const imageMedia = post.blog_media.filter((item) => item.type === "image");
  const videoMedia = post.blog_media.filter((item) => item.type === "video");
  const destinationName = resolveDestinationName(post.destination_record, post.destination) || "Travel";

  return (
    <Layout>
      <article className="py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-8">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
              <span className="font-semibold text-primary uppercase tracking-wider">{destinationName}</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(post.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">{post.title}</h1>
            {(post.image || imageMedia[0]?.url) && (
              <div className="rounded-2xl overflow-hidden mb-8">
                <img src={post.image || imageMedia[0]?.url} alt={post.title} className="w-full aspect-video object-cover" />
              </div>
            )}
            <div className="prose prose-slate max-w-none">
              {post.content.split("\n").map((line, index) => {
                if (line.startsWith("## ")) return <h2 key={index} className="text-xl font-display font-bold text-foreground mt-8 mb-3">{line.replace("## ", "")}</h2>;
                if (line.startsWith("**") && line.endsWith("**")) return <p key={index} className="font-semibold text-foreground">{line.replace(/\*\*/g, "")}</p>;
                if (line.trim() === "") return <br key={index} />;
                return <p key={index} className="text-muted-foreground leading-relaxed mb-2">{line}</p>;
              })}
            </div>

            {imageMedia.length > 0 && (
              <div className="mt-10">
                <h2 className="text-2xl font-display font-bold text-foreground mb-4">Gallery</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {imageMedia.map((item) => (
                    <div key={item.id} className="rounded-2xl overflow-hidden bg-card">
                      <img src={item.url} alt={item.caption || post.title} className="w-full h-64 object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {videoMedia.length > 0 && (
              <div className="mt-10">
                <h2 className="text-2xl font-display font-bold text-foreground mb-4">Videos</h2>
                <div className="space-y-4">
                  {videoMedia.map((item) => (
                    <video key={item.id} controls className="w-full rounded-2xl" src={item.url} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </article>
    </Layout>
  );
}
