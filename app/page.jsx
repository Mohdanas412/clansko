export default function LandingPage() {
  return (
    <main style={{ backgroundColor: '#0f0f1a' }} className="min-h-screen text-white">

      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <span className="text-lg font-light" style={{ color: '#a78bfa', letterSpacing: '0.08em' }}>
          clansko
        </span>
        <div className="flex gap-3">
          <a href="/login" className="px-4 py-2 text-sm rounded-lg border border-white/20 text-white/70 hover:text-white transition">
            Log in
          </a>
          <a href="/signup" className="px-4 py-2 text-sm rounded-lg text-white font-medium transition" style={{ backgroundColor: '#6c63ff' }}>
            Join now
          </a>
        </div>
      </nav>

      <section className="flex flex-col items-center justify-center text-center px-6 py-28">
        <span className="text-xs px-3 py-1 rounded-full mb-6 border" style={{ color: '#a78bfa', borderColor: '#6c63ff44', backgroundColor: '#6c63ff11' }}>
          For serious builder-minded students
        </span>
        <h1 className="text-4xl md:text-5xl font-medium leading-tight mb-4 max-w-2xl" style={{ color: '#f8fafc' }}>
          Find your tribe.
          <br />
          <span style={{ color: '#6c63ff' }}>Build together.</span>
        </h1>
        <p className="text-base md:text-lg max-w-xl mb-10" style={{ color: '#94a3b8' }}>
          ClanSko connects engineering students who want to build startups — not just get placed.
        </p>
        <a href="/signup" className="px-8 py-3 rounded-lg text-white font-medium text-base transition hover:opacity-90" style={{ backgroundColor: '#6c63ff' }}>
          Join the community
        </a>
        <p className="text-xs mt-5" style={{ color: '#94a3b8' }}>Free to join. Built for builders.</p>
      </section>

      <section className="px-6 py-20 max-w-4xl mx-auto">
        <h2 className="text-2xl font-medium text-center mb-12" style={{ color: '#f8fafc' }}>Sound familiar?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { emoji: '😶', title: 'You feel isolated', desc: 'Everyone around you is focused on placements. You want to build.' },
            { emoji: '🔍', title: 'No discovery system', desc: 'There is no platform to find other builder-minded students in India.' },
            { emoji: '💡', title: 'Ideas die alone', desc: 'You have ideas but no one to discuss, validate, or build with.' },
            { emoji: '📉', title: 'No accountability', desc: 'Without a system, consistency breaks. Goals get abandoned.' },
          ].map((item, i) => (
            <div key={i} className="p-6 rounded-xl border border-white/10" style={{ backgroundColor: '#16213e' }}>
              <div className="text-2xl mb-3">{item.emoji}</div>
              <h3 className="text-base font-medium mb-2" style={{ color: '#f8fafc' }}>{item.title}</h3>
              <p className="text-sm" style={{ color: '#94a3b8' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-20" style={{ backgroundColor: '#16213e11' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-medium text-center mb-12" style={{ color: '#f8fafc' }}>What ClanSko gives you</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: '🧠', title: 'Idea Feed', desc: 'Post your startup idea, get feedback, find people who get it.' },
              { icon: '🤝', title: 'Smart Discovery', desc: 'Find co-founders and teammates by skill, college, and goal.' },
              { icon: '🔥', title: 'Accountability', desc: 'Set weekly goals, track streaks, stay consistent with your tribe.' },
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-xl border border-white/10 text-center" style={{ backgroundColor: '#16213e' }}>
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="text-base font-medium mb-2" style={{ color: '#f8fafc' }}>{item.title}</h3>
                <p className="text-sm" style={{ color: '#94a3b8' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="text-center px-6 py-24">
        <h2 className="text-3xl font-medium mb-4" style={{ color: '#f8fafc' }}>Proof over intention.</h2>
        <p className="text-base mb-8" style={{ color: '#94a3b8' }}>Stop scrolling. Start building. Your people are already here.</p>
        <a href="/signup" className="px-8 py-3 rounded-lg text-white font-medium transition hover:opacity-90" style={{ backgroundColor: '#6c63ff' }}>
          Join ClanSko — it is free
        </a>
      </section>

      <footer className="text-center py-8 text-xs border-t border-white/10" style={{ color: '#94a3b8' }}>
        Built by a builder. For builders. — ClanSko 2025
      </footer>

    </main>
  )
}