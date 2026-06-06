import { StaticPage } from "@/components/StaticPage";
import { Cookie, Shield, BarChart3, Settings } from "lucide-react";

const TYPES = [
  { Icon: Shield, title: "Essential", desc: "Required for login, security, and core functionality. Cannot be disabled.", color: "text-neon-cyan" },
  { Icon: Settings, title: "Preferences", desc: "Remember your theme, language, and UI settings.", color: "text-neon-yellow" },
  { Icon: BarChart3, title: "Analytics", desc: "Help us understand how the product is used so we can improve it.", color: "text-neon-magenta" },
  { Icon: Cookie, title: "Marketing", desc: "Used to measure the effectiveness of campaigns. Optional.", color: "text-neon-purple" },
];

const Cookies = () => (
  <StaticPage title="Cookie Policy" subtitle="Last updated: June 6, 2026">
    <p>
      OFF AI uses cookies and similar technologies to keep you signed in, remember your preferences, and
      understand how the product is used.
    </p>

    <h2 className="text-2xl font-bold text-foreground mt-8 mb-4">Types of Cookies We Use</h2>
    <div className="not-prose grid sm:grid-cols-2 gap-4 mb-6">
      {TYPES.map(({ Icon, title, desc, color }, i) => (
        <div key={i} className="p-4 rounded-xl border border-border bg-card/50 backdrop-blur">
          <Icon className={`w-6 h-6 mb-2 ${color}`} />
          <h3 className="font-semibold mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </div>
      ))}
    </div>

    <h2 className="text-xl font-bold text-foreground mt-8 mb-2">Third-Party Cookies</h2>
    <p>
      Some cookies are set by trusted services we use, like analytics and payment providers. These
      partners have their own privacy policies.
    </p>

    <h2 className="text-xl font-bold text-foreground mt-8 mb-2">Managing Cookies</h2>
    <p>
      You can clear or block cookies through your browser settings. Note that blocking essential
      cookies will break sign-in and other core features.
    </p>

    <h2 className="text-xl font-bold text-foreground mt-8 mb-2">Updates</h2>
    <p>
      We may update this policy as our practices evolve. Check this page periodically for the latest
      version.
    </p>
  </StaticPage>
);

export default Cookies;
