import { StaticPage } from "@/components/StaticPage";
import { MapPin, Clock, Briefcase, Sparkles, Heart, Globe } from "lucide-react";

const JOBS = [
  { title: "Senior Full-Stack Engineer", location: "Remote", type: "Full-time", dept: "Engineering" },
  { title: "AI/ML Engineer", location: "Remote", type: "Full-time", dept: "AI Research" },
  { title: "Product Designer", location: "Remote", type: "Full-time", dept: "Design" },
  { title: "Growth Marketing Lead", location: "Remote", type: "Full-time", dept: "Marketing" },
  { title: "Community Manager", location: "Remote", type: "Part-time", dept: "Community" },
];

const PERKS = [
  { Icon: Globe, title: "Fully Remote", desc: "Work from anywhere in the world" },
  { Icon: Heart, title: "Health & Wellness", desc: "Comprehensive coverage for you and family" },
  { Icon: Sparkles, title: "Learning Budget", desc: "$2,000/year for courses and conferences" },
  { Icon: Briefcase, title: "Equity", desc: "Meaningful ownership in what you build" },
];

const Careers = () => (
  <StaticPage title="Careers" subtitle="Build the future of AI with us">
    <p>
      We're a small, distributed team obsessed with shipping delightful AI tools. If you love moving fast,
      taking ownership, and working with kind people — you'll fit right in.
    </p>

    <h2 className="text-2xl font-bold text-foreground mt-10 mb-4">Why OFF AI</h2>
    <div className="not-prose grid sm:grid-cols-2 gap-4 mb-8">
      {PERKS.map(({ Icon, title, desc }, i) => (
        <div key={i} className="p-4 rounded-xl border border-border bg-card/50 backdrop-blur">
          <Icon className="w-6 h-6 text-neon-cyan mb-2" />
          <h3 className="font-semibold mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </div>
      ))}
    </div>

    <h2 className="text-2xl font-bold text-foreground mt-10 mb-4">Open Positions</h2>
    <div className="not-prose space-y-3">
      {JOBS.map((job, i) => (
        <div
          key={i}
          className="p-5 rounded-xl border border-border bg-card/60 backdrop-blur hover:border-primary/50 transition-all cursor-pointer"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-foreground">{job.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{job.dept}</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {job.type}</span>
            </div>
          </div>
        </div>
      ))}
    </div>

    <p className="mt-8 text-sm text-muted-foreground">
      Don't see your role? Reach out anyway — we're always looking for talented people.
    </p>
  </StaticPage>
);

export default Careers;
