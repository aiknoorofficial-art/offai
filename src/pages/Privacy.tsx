import { StaticPage } from "@/components/StaticPage";

const Privacy = () => (
  <StaticPage title="Privacy Policy" subtitle="Last updated: June 6, 2026">
    <p>
      Your privacy matters to us. This policy describes what information OFF AI collects, how we use it,
      and the choices you have.
    </p>

    <h2 className="text-xl font-bold text-foreground mt-8 mb-2">1. Information We Collect</h2>
    <p>We collect information you provide directly:</p>
    <ul className="list-disc pl-6 space-y-1">
      <li>Account details: name, email, profile photo</li>
      <li>Content you create: prompts, generated outputs, course listings</li>
      <li>Payment details handled by our payment partners (we do not store card numbers)</li>
    </ul>
    <p>We also collect automatically:</p>
    <ul className="list-disc pl-6 space-y-1">
      <li>Usage analytics and device/browser info</li>
      <li>Cookies and similar technologies (see our Cookie Policy)</li>
    </ul>

    <h2 className="text-xl font-bold text-foreground mt-8 mb-2">2. How We Use Information</h2>
    <ul className="list-disc pl-6 space-y-1">
      <li>To provide, maintain, and improve the OFF AI services</li>
      <li>To process transactions and manage course/referral payouts</li>
      <li>To send important account and product updates</li>
      <li>To prevent fraud and abuse</li>
    </ul>

    <h2 className="text-xl font-bold text-foreground mt-8 mb-2">3. Sharing</h2>
    <p>
      We never sell your personal data. We share limited data only with service providers (hosting,
      analytics, AI model providers, payment processors) under strict confidentiality.
    </p>

    <h2 className="text-xl font-bold text-foreground mt-8 mb-2">4. Your Rights</h2>
    <p>
      You can access, export, or delete your account data anytime from your profile page. You may also
      request a copy of all data we hold about you.
    </p>

    <h2 className="text-xl font-bold text-foreground mt-8 mb-2">5. Security</h2>
    <p>
      We use industry-standard encryption in transit and at rest, role-based access controls, and
      row-level security on our databases.
    </p>

    <h2 className="text-xl font-bold text-foreground mt-8 mb-2">6. Contact</h2>
    <p>
      Questions? Reach us through our WhatsApp support or email — we'll respond within 48 hours.
    </p>
  </StaticPage>
);

export default Privacy;
