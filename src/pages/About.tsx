import { StaticPage } from "@/components/StaticPage";
import { Sparkles, Zap, Code2, Video, MessageSquare, Users, Target, Heart } from "lucide-react";

const About = () => (
  <StaticPage title="About Us" subtitle="Empowering creators with AI">
    <section className="not-prose grid sm:grid-cols-3 gap-4 my-8">
      {[
        { Icon: Users, label: "10K+ Creators", color: "text-neon-cyan" },
        { Icon: Sparkles, label: "5+ AI Tools", color: "text-neon-magenta" },
        { Icon: Zap, label: "Lightning Fast", color: "text-neon-yellow" },
      ].map(({ Icon, label, color }, i) => (
        <div key={i} className="p-4 rounded-xl border border-border bg-card/50 backdrop-blur text-center">
          <Icon className={`w-8 h-8 mx-auto mb-2 ${color}`} />
          <p className="text-sm font-semibold">{label}</p>
        </div>
      ))}
    </section>

    <h2 className="text-2xl font-bold text-foreground mt-8 mb-3 flex items-center gap-2">
      <Target className="w-6 h-6 text-neon-cyan" /> Our Mission
    </h2>
    <p>
      At OFF AI, we believe powerful AI tools should be accessible to everyone. Our mission is to give
      developers, creators, and entrepreneurs an all-in-one suite to ship ideas faster — from generating
      code and videos to crafting thumbnails and chatting with cutting-edge AI models.
    </p>

    <h2 className="text-2xl font-bold text-foreground mt-8 mb-3 flex items-center gap-2">
      <Heart className="w-6 h-6 text-neon-magenta" /> Our Story
    </h2>
    <p>
      OFF AI started with a simple idea: stop juggling a dozen subscriptions. We've combined the best AI
      models behind one elegant interface, so you can focus on building instead of integrating.
    </p>

    <h2 className="text-2xl font-bold text-foreground mt-8 mb-3">What We Build</h2>
    <ul className="space-y-2">
      <li className="flex items-start gap-2"><Code2 className="w-5 h-5 text-neon-cyan mt-0.5" /> AI code generation in your favorite languages</li>
      <li className="flex items-start gap-2"><Video className="w-5 h-5 text-neon-magenta mt-0.5" /> Cinematic video generation powered by Runway ML</li>
      <li className="flex items-start gap-2"><MessageSquare className="w-5 h-5 text-neon-yellow mt-0.5" /> Conversational AI with Gemini 2.5 Flash</li>
      <li className="flex items-start gap-2"><Sparkles className="w-5 h-5 text-neon-purple mt-0.5" /> A marketplace of courses from real creators</li>
    </ul>
  </StaticPage>
);

export default About;
