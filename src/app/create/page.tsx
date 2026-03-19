import Header from "@/components/ui/Header";
import CreatePostForm from "@/components/post/CreatePostForm";

export default function CreatePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-xl mx-auto px-5 py-8">
        <h1 className="text-2xl font-bold mb-8">
          どっちがいい？
        </h1>
        <CreatePostForm />
      </main>
    </div>
  );
}
