export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">AI Engine</h1>
      <p className="text-xl text-muted-foreground">
        Enterprise AI Application Platform
      </p>
      <div className="mt-8 flex gap-4">
        <a
          href="/apps"
          className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Get Started
        </a>
        <a
          href="http://localhost:3000/docs"
          className="px-6 py-3 border border-input rounded-md hover:bg-accent hover:text-accent-foreground"
        >
          API Docs
        </a>
      </div>
    </main>
  )
}
