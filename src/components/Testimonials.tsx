const testimonials = [
  {
    quote:
      "Bro this thing roasted my resume harder than my mom. But honestly the rewrites are 🔥 — got 2 internship calls after fixing what it said.",
    name: "Aarav S.",
    role: "B.Tech CSE, 3rd year · Pune",
  },
  {
    quote:
      "Finally an ATS checker that doesn't ask me to sign up or pay. Used the builder for my first off-campus application.",
    name: "Priya K.",
    role: "MCA fresher · Bengaluru",
  },
  {
    quote:
      "The recruiter reactions section is goated. Made me realise my projects sounded boring AF.",
    name: "Rohit M.",
    role: "ECE, final year · Hyderabad",
  },
];

export function Testimonials() {
  return (
    <section aria-labelledby="testimonials-heading" className="mx-auto w-full max-w-5xl px-4 py-16">
      <h2 id="testimonials-heading" className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
        Loved by students across India
      </h2>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Real feedback from freshers using ResumeRIP before applying.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((t) => (
          <figure
            key={t.name}
            className="rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur transition-colors hover:bg-card/60"
          >
            <blockquote className="text-sm leading-relaxed text-foreground/90">
              "{t.quote}"
            </blockquote>
            <figcaption className="mt-4 border-t border-border/40 pt-3 text-xs">
              <p className="font-semibold text-foreground">{t.name}</p>
              <p className="text-muted-foreground">{t.role}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}