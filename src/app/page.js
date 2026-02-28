import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-[#8C92D8] text-white">

      {/* Navbar */}
      <nav className="w-full px-4 sm:px-10 py-5 flex justify-between items-center">
        <h1 className="flex justify-center items-center text-2xl sm:text-4xl font-extrabold tracking-tight">
          <img className="w-17 h-17" src="comedy.png" alt="comedy" />
          <span className="font-mono">GrinIn</span>
        </h1>

        <Link href="/auth/login">
          <button className="p-2 ml-2 bg-white text-[#5A4FCF] font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.03] transition-all duration-300">
            Get Started
          </button>
        </Link>
      </nav>

      {/* Hero Section */}
      <section>
        <section className="flex flex-col justify-center items-center text-center px-6 sm:px-10 py-16 sm:py-20 md:py-28">

          {/* Headline Stack */}
          <div className="space-y-1 leading-tight">

            <h2 className="text-4xl sm:text-5xl md:text-6xl font-semibold">
             <img src="./genz.png" alt="genz" />
              {/* <span className="font-extrabold">G</span><span className="text-4xl font-extrabold">E</span><span className="text-4xl font-extrabold">N</span><span className="text-6xl font-extrabold italic">z</span>  */}
            </h2>

            <h3 className="text-xl font-mono sm:text-2xl md:text-3xl font-extrabold italic ">
              style
            </h3>

            <h1 className="text-3xl text-[#5A4FCF] sm:text-3xl md:text-5xl font-black tracking-tight font-mono">
              Attendance
            </h1>

          </div>
          
          {/* CTA */}
          <Link href="/auth/login">
            <button className="mt-10 px-8 py-3 bg-white text-[#5A4FCF] font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.03] transition-all duration-300">
              Start Taking Attendance
            </button>
          </Link>

        </section>
      </section>
      
    </main>
  );
}
