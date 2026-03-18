import Header from "@/components/ui/Header";
import CreatePostForm from "@/components/post/CreatePostForm";

export default function CreatePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-center mb-6">
          どっちがいい？
        </h1>
        <CreatePostForm />
      </main>
    </div>
  );
}
