import HeaderBlock from "~/modules/pageBlocks/components/blocks/marketing/header/HeaderBlock";
import { useTranslation } from "react-i18next";
import { json, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { getTranslations } from "~/locale/i18next.server";
import FooterBlock from "~/modules/pageBlocks/components/blocks/marketing/footer/FooterBlock";
import CookieConsentSettings from "~/components/cookies/CookieConsentSettings";
import { useState } from "react";
import OpenModal from "~/components/ui/modals/OpenModal";
import { getLinkTags } from "~/modules/pageBlocks/services/.server/pagesService";

export const meta: MetaFunction<typeof loader> = ({ data }) => data?.metatags || [];
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { t } = await getTranslations(request);

  return json({
    metatags: [{ title: `${t("front.privacy.title")} | ${process.env.APP_NAME}` }, ...getLinkTags(request)],
  });
};

export default function PrivacyPolicyRoute() {
  const { t } = useTranslation();
  const [showCookieSettingsModal, setShowCookieSettingsModal] = useState(false);
  return (
    <div>
      <div>
        <HeaderBlock />

        {showCookieSettingsModal && (
          <OpenModal onClose={() => setShowCookieSettingsModal(false)}>
            <CookieConsentSettings onUpdated={() => setShowCookieSettingsModal(false)} />
          </OpenModal>
        )}

        <div className="min-h-screen py-6">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="sm:align-center space-y-4 sm:flex sm:flex-col">
              <div className="prose mx-auto text-gray-500">
                <h1 className="flex justify-center text-3xl font-extrabold tracking-tight sm:text-4xl">{t("front.privacy.title")}</h1>
                <p className="text-center">Last Updated: {new Date().toLocaleDateString()}</p>
                <button
                  type="button"
                  onClick={() => setShowCookieSettingsModal(true)}
                  className="text-theme-500 hover:text-theme-600 dark:hover:text-theme-400 underline"
                >
                  {t("cookies.settings")}
                </button>
                <p>
                  Thank you for using Reddit Research ("we," "us," or "our"). This Privacy Policy explains how we collect, use, and protect your information when you use our website and services.
                </p>

                <h3 className="text-black dark:text-white">1. Information We Collect</h3>

                <h4 className="text-black dark:text-white">Personal Information:</h4>
                <ul>
                  <li>Name</li>
                  <li>Email address</li>
                  <li>Payment information (processed securely through our payment processors)</li>
                </ul>

                <h4 className="text-black dark:text-white">Non-Personal Information:</h4>
                <ul>
                  <li>Web cookies for site functionality and user experience</li>
                  <li>Browser and device information</li>
                  <li>Usage patterns and preferences</li>
                  <li>Reddit data that you request to analyze (in accordance with Reddit's API terms)</li>
                </ul>

                <h3 className="text-black dark:text-white">2. How We Use Your Information</h3>

                <p>We collect your personal information solely for:</p>
                <ul>
                  <li>Processing your orders and subscriptions</li>
                  <li>Providing access to our Reddit research services</li>
                  <li>Communicating important updates about our service</li>
                  <li>Improving your user experience</li>
                  <li>Analyzing Reddit content according to your research requests</li>
                </ul>

                <h3 className="text-black dark:text-white">3. Data Sharing and Protection</h3>

                <p>
                  We do not share your personal information with any third parties except as necessary for payment processing. Your data security is our priority, and we implement appropriate measures to protect your information.
                </p>

                <p>
                  When we collect and process personal information, and while we retain this information, we will protect it within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use, or modification.
                </p>

                <p>
                  Although we will do our best to protect the personal information you provide to us, we advise that no method of electronic transmission or storage is 100% secure, and no one can guarantee absolute data security. We will comply with laws applicable to us in respect of any data breach.
                </p>

                <h3 className="text-black dark:text-white">4. Children's Privacy</h3>

                <p>
                  Reddit Research is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal data from a child under 13, we will take steps to delete such information.
                </p>

                <h3 className="text-black dark:text-white">5. Cookies</h3>

                <p>
                  We use cookies to enhance your browsing experience. You can control cookie settings through your browser preferences or by using our cookie settings panel.
                </p>

                <h3 className="text-black dark:text-white">6. Reddit Data Usage</h3>

                <p>
                  Our service analyzes publicly available Reddit data in accordance with Reddit's API Terms of Service. We:
                </p>
                <ul>
                  <li>Only access and analyze data that is publicly available on Reddit</li>
                  <li>Do not store Reddit content beyond what is necessary for your research requests</li>
                  <li>Respect Reddit's rate limits and API guidelines</li>
                  <li>Do not redistribute Reddit content without proper attribution</li>
                </ul>

                <h3 className="text-black dark:text-white">7. Your Rights and Control</h3>

                <p>You have the right to:</p>
                <ul>
                  <li>Access your personal information</li>
                  <li>Request corrections to your data</li>
                  <li>Request deletion of your data</li>
                  <li>Opt-out of marketing communications</li>
                </ul>

                <h3 className="text-black dark:text-white">8. Updates to Privacy Policy</h3>

                <p>
                  We may update this Privacy Policy periodically. Users will be notified of any significant changes via email.
                </p>

                <h3 className="text-black dark:text-white">9. Contact Information</h3>

                <p>
                  For any questions or concerns about this Privacy Policy, please contact us at:
                  [Your Contact Information]
                </p>

                <p>
                  By using Reddit Research, you agree to the terms outlined in this policy.
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
