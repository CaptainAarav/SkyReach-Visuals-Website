const ABOUT_VIDEO = '/videos/paul-srv.mp4';
const ABOUT_POSTER = '/gallery-poster.jpg';

export default function About() {
  return (
    <>
      {/* Hero with video background — single full load */}
      <section className="relative py-24 overflow-hidden bg-black rounded-b-3xl">
        <video src={ABOUT_VIDEO} poster={ABOUT_POSTER} className="absolute inset-0 w-full h-full object-cover opacity-40" muted loop playsInline autoPlay preload="auto" aria-hidden />
        <div className="absolute inset-0 bg-accent/30" aria-hidden />
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold max-w-3xl text-white">
            We see the world differently.
          </h1>
          <p className="mt-6 text-white/85 max-w-2xl leading-relaxed text-lg">
            SkyReach Visuals was founded in Bournemouth with one goal: to make
            professional aerial videography accessible to businesses of every size.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-semibold text-white">Our story</h2>
          <p className="mt-6 text-cream/80 leading-relaxed">
            We started out filming property aerials for a local estate agent in
            Poole. The footage looked good. The listings sold faster. Word got
            around. Before long we were shooting for construction firms, event
            organisers, tourism boards, and independent filmmakers across the south
            coast.
          </p>
          <p className="mt-4 text-cream/80 leading-relaxed">
            Today, SkyReach Visuals is a fully certified drone operation based out
            of Bournemouth. We hold a current CAA Operational Authorisation and
            carry full public liability insurance. Every shoot is planned,
            risk-assessed, and delivered to a broadcast-ready standard — whether
            it&rsquo;s a half-hour flyover or a full-day cinematic production.
          </p>
        </div>
      </section>

      {/* Video section — metadata only until needed */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="aspect-video max-h-[400px] w-full rounded-2xl overflow-hidden bg-black/40">
          <video src={ABOUT_VIDEO} poster={ABOUT_POSTER} className="w-full h-full object-cover" muted loop playsInline autoPlay preload="metadata" aria-hidden />
        </div>
      </section>

      {/* Values */}
      <section className="bg-bg-elevated rounded-3xl mx-4 md:mx-6">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <h2 className="text-3xl font-semibold text-white">How we work</h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <h3 className="text-lg font-semibold text-white">Cinematic quality</h3>
              <p className="mt-3 text-cream/70 leading-relaxed text-sm">
                We shoot in 4K with professional-grade drones and stabilisation
                systems. Every clip is colour-graded and edited to a standard
                you&rsquo;d expect from a production house, not a bloke with a
                Mavic in a car park.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Reliable delivery</h3>
              <p className="mt-3 text-cream/70 leading-relaxed text-sm">
                We give you a delivery date and we stick to it. Our standard
                turnaround is 3 to 7 working days depending on the package. Rush
                edits are available if you need them.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Client-first approach</h3>
              <p className="mt-3 text-cream/70 leading-relaxed text-sm">
                We keep things straightforward. Clear pricing, no jargon, and a
                single point of contact from booking through to delivery. If
                you&rsquo;re not happy with the edit, we&rsquo;ll revise it until
                you are.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team placeholder with video — poster + metadata to avoid duplicate full load */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="aspect-square rounded-2xl overflow-hidden bg-black/40">
            <video src={ABOUT_VIDEO} poster={ABOUT_POSTER} className="w-full h-full object-cover" muted loop playsInline autoPlay preload="metadata" aria-hidden />
          </div>
          <div>
            <h2 className="text-3xl font-semibold text-white">Meet the pilot</h2>
            <p className="mt-4 text-cream/80 leading-relaxed">
              Every SkyReach shoot is operated by a fully CAA-certified pilot with
              commercial flight experience across residential, industrial, and
              public event environments. We don&rsquo;t subcontract. The person you
              speak to is the person who flies.
            </p>
            <p className="mt-4 text-cream/80 leading-relaxed">
              Based in Bournemouth, we cover Dorset, Hampshire, and Wiltshire as
              standard. We regularly travel further afield for larger projects —
              just get in touch.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
