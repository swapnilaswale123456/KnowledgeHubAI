import HeaderBlock from "~/modules/pageBlocks/components/blocks/marketing/header/HeaderBlock";
import { useTranslation } from "react-i18next";
import { json, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { getTranslations } from "~/locale/i18next.server";
import FooterBlock from "~/modules/pageBlocks/components/blocks/marketing/footer/FooterBlock";
import { getLinkTags } from "~/modules/pageBlocks/services/.server/pagesService";

export const meta: MetaFunction<typeof loader> = ({ data }) => data?.metatags || [];
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { t } = await getTranslations(request);
  return json({
    metatags: [{ title: `${t("front.terms.title")} | ${process.env.APP_NAME}` }, ...getLinkTags(request)],
  });
};

export default function TermsAndConditionsRoute() {
  const { t } = useTranslation();

  return (
    <div>
      <div>
        <HeaderBlock />
        <div className="min-h-screen py-6">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="sm:align-center space-y-4 sm:flex sm:flex-col">
              <div className="prose mx-auto text-gray-500">
                <h1 className="flex justify-center text-3xl font-extrabold tracking-tight sm:text-4xl">{t("front.terms.title")}</h1>
                <p className="text-center">Last Updated: {new Date().toLocaleDateString()}</p>

                <h3 className="text-black dark:text-white">Introduction</h3>

                <p>
                  Welcome to Reddit Research ("we," "our," or "us"). These Terms of Service ("Terms") govern your use of Reddit Research's website and all services provided by Reddit Research. By accessing or using our service, you agree to be bound by these terms.
                </p>

                <h3 className="text-black dark:text-white">1. Description of Service</h3>

                <p>
                  Reddit Research is a platform that helps users analyze and research Reddit content across various subreddits. We provide access to Reddit data analysis, insights, and research capabilities to help users understand trends, discussions, and information on Reddit.
                </p>

                <h3 className="text-black dark:text-white">2. User Rights and Responsibilities</h3>

                <h4 className="text-black dark:text-white">2.1 Account Access</h4>
                <ul>
                  <li>You must maintain the confidentiality of your account credentials</li>
                  <li>You are responsible for all activities under your account</li>
                  <li>You must be 13 years or older to use our services</li>
                </ul>

                <h4 className="text-black dark:text-white">2.2 Acceptable Use</h4>
                <ul>
                  <li>You agree to use the service for lawful purposes only</li>
                  <li>You will not attempt to scrape or mass download Reddit data</li>
                  <li>You will respect the privacy of Reddit users and content</li>
                  <li>You will not use our service for any purpose that violates Reddit's terms of service</li>
                  <li>You will respect Reddit's rate limits and API guidelines</li>
                </ul>

                <h3 className="text-black dark:text-white">3. Service Tiers and Payment</h3>

                <h4 className="text-black dark:text-white">3.1 Free Tier</h4>
                <ul>
                  <li>Limited access to Reddit research features</li>
                  <li>No payment information required</li>
                </ul>

                <h4 className="text-black dark:text-white">3.2 Premium Features</h4>
                <ul>
                  <li>Full access to all research features and data</li>
                  <li>Subscription-based payment required</li>
                  <li>Automatic renewal unless cancelled</li>
                </ul>

                <h3 className="text-black dark:text-white">4. Data Usage and Privacy</h3>

                <ul>
                  <li>We collect and analyze publicly available Reddit data</li>
                  <li>User data collection is limited to name, email, and payment information</li>
                  <li>We respect Reddit's content guidelines and copyright laws</li>
                  <li>We do not store or redistribute Reddit content without proper attribution</li>
                  <li>For complete details, see our Privacy Policy</li>
                </ul>

                <h3 className="text-black dark:text-white">5. Intellectual Property</h3>

                <ul>
                  <li>All content and data analysis methods remain property of Reddit Research</li>
                  <li>Users may not redistribute or resell our data or analysis</li>
                  <li>Reddit content accessed through our service remains the property of Reddit and its users</li>
                  <li>Users retain rights to their own content and communications</li>
                </ul>

                <h3 className="text-black dark:text-white">6. Service Modifications</h3>

                <p>We reserve the right to:</p>
                <ul>
                  <li>Modify or discontinue features</li>
                  <li>Update pricing with notice</li>
                  <li>Improve or adjust our analysis methods</li>
                  <li>Update these terms at any time, with notice to users</li>
                </ul>

                <h3 className="text-black dark:text-white">7. Termination</h3>

                <p>We may terminate or suspend access to our service:</p>
                <ul>
                  <li>For violations of these Terms</li>
                  <li>For abusive or fraudulent behavior</li>
                  <li>For extended periods of inactivity</li>
                  <li>At our discretion with notice</li>
                </ul>

                <h3 className="text-black dark:text-white">8. Governing Law & Jurisdiction</h3>

                <p>
                  These terms shall be governed by and construed in accordance with the laws of your jurisdiction, without regard to its conflict of law provisions.
                </p>

                <h3 className="text-black dark:text-white">9. Reddit Attribution</h3>

                <p>
                  This service is not affiliated with, authorized, maintained, sponsored, or endorsed by Reddit Inc. or any of its affiliates or subsidiaries. This is an independent and unofficial service. Reddit is a registered trademark of Reddit Inc.
                </p>

                <h3 className="text-black dark:text-white">10. Contact Information</h3>

                <p>
                  For questions or concerns regarding these Terms, please contact us at:
                  [Your Contact Information]
                </p>

                <p>
                  By using Reddit Research, you acknowledge that you have read and agree to these Terms of Service.
                </p>
              </div>
            </div>
          </div>
        </div>
        <FooterBlock />
      </div>
    </div>
  );
}
