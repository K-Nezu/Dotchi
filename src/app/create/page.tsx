import Header from "@/components/ui/Header";
import CreatePostForm from "@/components/post/CreatePostForm";

export default function CreatePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-xl mx-auto px-5 py-8">
        <CreatePostForm />
      </main>
    </div>
  );
}
