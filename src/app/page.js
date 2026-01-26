import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-4 border-b">
        <h1 className="text-xl font-bold">Selfie Attendance</h1>

        <Link href="/auth/login">
          <button className="px-4 py-2 bg-black text-white rounded">
            Get Started
          </button>
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-1 flex-col items-center justify-center text-center px-6">
        <h2 className="text-4xl font-bold mb-4">
          Smart Selfie Attendance System
        </h2>

        <p className="text-gray-600 max-w-xl">
          A fast, secure and classroom-friendly attendance system designed to
          avoid errors, cheating, and crowd selfies.
        </p>
      </section>
    </main>
  );
}
