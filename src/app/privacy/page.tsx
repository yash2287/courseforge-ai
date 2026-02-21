import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - CourseForge AI",
  description: "Privacy Policy for CourseForge AI training course generator platform.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-cream">
      <nav className="sticky top-0 z-50 bg-cream/80 backdrop-blur-md border-b border-charcoal/5">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between max-w-4xl">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 bg-charcoal rounded-lg flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-gold" />
            </div>
            <span className="text-xl font-semibold text-charcoal">CourseForge</span>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-sm text-warm-gray hover:text-charcoal transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-6 max-w-4xl py-16">
        <h1 className="text-4xl font-light text-charcoal mb-2">Privacy Policy</h1>
        <p className="text-warm-gray mb-12">Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>

        <div className="prose prose-charcoal max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-charcoal mb-4">1. Information We Collect</h2>
            <p className="text-warm-gray leading-relaxed">
              We collect information you provide directly, including: your name, email address, and organization details when you create an account; course content you create and customize; and payment information processed securely through Stripe.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-charcoal mb-4">2. How We Use Information</h2>
            <p className="text-warm-gray leading-relaxed">
              We use collected information to: provide and maintain the Service; process payments and send billing notifications; send course assignments and deadline reminders; improve our AI models and service quality; and comply with legal obligations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-charcoal mb-4">3. Data Storage & Security</h2>
            <p className="text-warm-gray leading-relaxed">
              Your data is stored securely using industry-standard encryption. We use Clerk for authentication (SOC 2 compliant) and Convex for database storage. All data is transmitted over HTTPS. We implement appropriate technical and organizational measures to protect your data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-charcoal mb-4">4. Third-Party Services</h2>
            <p className="text-warm-gray leading-relaxed">
              We use the following third-party services to provide our platform: Clerk (authentication), Convex (database), Google Gemini (AI generation), Stripe (payments), and Resend (email delivery). Each service has its own privacy policy governing data handling.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-charcoal mb-4">5. AI & Content Processing</h2>
            <p className="text-warm-gray leading-relaxed">
              When you use AI course generation, your input prompts and generated content are processed by Google Gemini. We do not use your content to train AI models. Generated content is stored in your account and is accessible only to you and authorized members of your organization.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-charcoal mb-4">6. Data Sharing</h2>
            <p className="text-warm-gray leading-relaxed">
              We do not sell your personal data. We share data only with: service providers necessary to operate the platform; law enforcement when legally required; and within your organization as configured by your organization&apos;s administrators.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-charcoal mb-4">7. Your Rights</h2>
            <p className="text-warm-gray leading-relaxed">
              You have the right to: access your personal data; correct inaccurate data; request deletion of your data; export your data in a portable format; and opt out of marketing communications. Contact us to exercise these rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-charcoal mb-4">8. Cookies</h2>
            <p className="text-warm-gray leading-relaxed">
              We use essential cookies for authentication and session management. We do not use tracking or advertising cookies. Analytics cookies are used only with your consent to improve the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-charcoal mb-4">9. GDPR Compliance</h2>
            <p className="text-warm-gray leading-relaxed">
              For users in the European Economic Area (EEA), we process data under lawful bases including: consent, contractual necessity, and legitimate interests. You may withdraw consent at any time. Our Data Protection Officer can be reached at{" "}
              <a href="mailto:privacy@courseforge.ai" className="text-gold hover:text-gold-dark">
                privacy@courseforge.ai
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-charcoal mb-4">10. Contact</h2>
            <p className="text-warm-gray leading-relaxed">
              For privacy-related questions, contact us at{" "}
              <a href="mailto:privacy@courseforge.ai" className="text-gold hover:text-gold-dark">
                privacy@courseforge.ai
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
