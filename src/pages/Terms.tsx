import { StaticPage } from "@/components/StaticPage";

const Terms = () => (
  <StaticPage title="Terms of Service" subtitle="Last updated: June 6, 2026">
    <p>
      By accessing or using OFF AI, you agree to these Terms. Please read them carefully.
    </p>

    <h2 className="text-xl font-bold text-foreground mt-8 mb-2">1. Accounts</h2>
    <p>
      You must provide accurate information and keep your credentials secure. You are responsible for
      all activity under your account.
    </p>

    <h2 className="text-xl font-bold text-foreground mt-8 mb-2">2. Acceptable Use</h2>
    <p>You agree not to:</p>
    <ul className="list-disc pl-6 space-y-1">
      <li>Generate content that is illegal, harmful, hateful, or sexually explicit involving minors</li>
      <li>Attempt to reverse engineer, scrape, or abuse the platform</li>
      <li>Resell access to the AI tools without permission</li>
      <li>Upload malware or violate others' intellectual property</li>
    </ul>

    <h2 className="text-xl font-bold text-foreground mt-8 mb-2">3. Content Ownership</h2>
    <p>
      You own the content you create using OFF AI, subject to the licenses of the underlying AI models.
      You grant us a limited license to host and display your content as needed to operate the service.
    </p>

    <h2 className="text-xl font-bold text-foreground mt-8 mb-2">4. Payments & Refunds</h2>
    <p>
      Paid features and courses are billed as described at purchase. Course access unlocks only after
      admin approval. Refunds are handled case-by-case within 14 days of purchase.
    </p>

    <h2 className="text-xl font-bold text-foreground mt-8 mb-2">5. Termination</h2>
    <p>
      We may suspend or terminate accounts that violate these Terms. You may close your account anytime
      from your profile.
    </p>

    <h2 className="text-xl font-bold text-foreground mt-8 mb-2">6. Disclaimer</h2>
    <p>
      OFF AI is provided "as is". AI-generated content may be inaccurate — always review before
      using in production. We are not liable for indirect or consequential damages.
    </p>

    <h2 className="text-xl font-bold text-foreground mt-8 mb-2">7. Changes</h2>
    <p>
      We may update these Terms. Material changes will be announced in-app or by email.
    </p>
  </StaticPage>
);

export default Terms;
