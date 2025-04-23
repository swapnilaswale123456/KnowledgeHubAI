import FooterBlock from "~/modules/pageBlocks/components/blocks/marketing/footer/FooterBlock";
import HeaderBlock from "~/modules/pageBlocks/components/blocks/marketing/header/HeaderBlock";
import { useEffect, useRef, useState } from "react";
import { ActionFunction, json, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { getTranslations } from "~/locale/i18next.server";
import OpenSuccessModal from "~/components/ui/modals/OpenSuccessModal";
import OpenErrorModal from "~/components/ui/modals/OpenErrorModal";
import ServerError from "~/components/ui/errors/ServerError";
import WarningBanner from "~/components/ui/banners/WarningBanner";
import CrmService, { ContactFormSettings } from "~/modules/crm/services/CrmService";
import { getCurrentPage } from "~/modules/pageBlocks/services/.server/pagesService";
import PageBlocks from "~/modules/pageBlocks/components/blocks/PageBlocks";
import { PageLoaderData } from "~/modules/pageBlocks/dtos/PageBlockData";
import { useTypedLoaderData } from "remix-typedjson";
import { createMetrics } from "~/modules/metrics/services/.server/MetricTracker";
import HoneypotInput from "~/components/ui/honeypot/HoneypotInput";
import UserUtils from "~/utils/app/UserUtils";
import IpAddressServiceServer from "~/modules/ipAddress/services/IpAddressService.server";
import ButtonPrimary from "~/components/ui/buttons/ButtonPrimary";
import InputText from "~/components/ui/input/InputText";
import InputSelect from "~/components/ui/input/InputSelect";
import Logo from "~/components/brand/Logo";

type LoaderData = PageLoaderData & {
  settings: ContactFormSettings;
};
export const handle = { i18n: "translations" };
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, "contact");
  const page = await time(getCurrentPage({ request, params, slug: "/contact" }), "getCurrentPage.contact");
  const data: LoaderData = {
    ...page,
    settings: await CrmService.getContactFormSettings(),
  };
  return json(data, { headers: getServerTimingHeader() });
};

type ActionData = {
  error?: string;
  success?: string;
};
export const action: ActionFunction = async ({ request }) => {
  const { t } = await getTranslations(request);
  const form = await request.formData();
  const action = form.get("action");
  if (action === "submission") {
    const submission = {
      firstName: form.get("first_name")?.toString() ?? "",
      lastName: form.get("last_name")?.toString() ?? "",
      email: form.get("email")?.toString() ?? "",
      company: form.get("company")?.toString() ?? "",
      jobTitle: form.get("jobTitle")?.toString() ?? "",
      users: form.get("users")?.toString() ?? "",
      message: form.get("comments")?.toString() ?? "",
      honeypot: form.get("codeId")?.toString() ?? "",
    };
    try {
      await IpAddressServiceServer.log(request, {
        action: "contact",
        description: `${submission.firstName} ${submission.lastName} <${submission.email}>`,
        metadata: submission,
        block: UserUtils.isSuspicious({
          email: submission.email,
          firstName: submission.firstName,
          lastName: submission.lastName,
          honeypot: submission.honeypot,
        }),
      });
      const existingContact = await CrmService.createContactSubmission(submission);
      if (existingContact) {
        const data: ActionData = {
          success: t("front.contact.success", { 0: submission.firstName }),
        };
        return json(data, { status: 200 });
      } else {
        const data: ActionData = {
          error: t("front.contact.error"),
        };
        return json(data, { status: 400 });
      }
    } catch (e: any) {
      return json({ error: e.message }, { status: 400 });
    }
  } else {
    const data: ActionData = {
      error: t("shared.invalidForm"),
    };
    return json(data, { status: 200 });
  }
};

export const meta: MetaFunction<typeof loader> = ({ data }) => data?.metatags || [];

export default function ContactRoute() {
  const { t } = useTranslation();
  const data = useTypedLoaderData<LoaderData>();
  const actionData = useActionData<{ error?: string; success?: string }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting" && navigation.formData?.get("action") === "submission";

  const formRef = useRef<HTMLFormElement>(null);

  const [actionResult, setActionResult] = useState<{ error?: string; success?: string }>();

  useEffect(() => {
    setActionResult(actionData);
  }, [actionData]);

  useEffect(() => {
    if (!isSubmitting && actionData?.success) {
      formRef.current?.reset();
    }
  }, [actionData?.success, isSubmitting]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
      <HeaderBlock />
      <PageBlocks items={data.blocks} />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="sm:align-center sm:flex sm:flex-col">
          <div className="relative mx-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white px-6 py-12 shadow-xl">
            <div className="text-center">
              <div className="flex justify-center mb-8">
                <Logo size="lg" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">{t("front.contact.title")}</h1>
              <p className="mt-4 text-lg leading-6 text-gray-600">{t("front.contact.headline")}</p>
            </div>

            {data.settings.error ? (
              <WarningBanner title={t("shared.error")} text={data.settings.error} />
            ) : data.settings.actionUrl ? (
              <form ref={formRef} action={data.settings.actionUrl} method="POST" className="mt-8">
                <HoneypotInput name="_gotcha" />
                <ContactForm />
              </form>
            ) : data.settings.crm ? (
              <Form ref={formRef} method="post" className="mt-8">
                <input type="hidden" name="action" value="submission" hidden readOnly />
                <HoneypotInput name="codeId" />
                <ContactForm />
              </Form>
            ) : null}
          </div>
        </div>
      </div>

      <FooterBlock />

      <OpenSuccessModal
        title={t("shared.success")}
        description={actionResult?.success?.toString() ?? ""}
        open={!!actionResult?.success}
        onClose={() => setActionResult(undefined)}
      />

      <OpenErrorModal
        title={t("shared.error")}
        description={actionResult?.error?.toString() ?? ""}
        open={!!actionResult?.error}
        onClose={() => setActionResult(undefined)}
      />
    </div>
  );
}

export function ErrorBoundary() {
  return <ServerError />;
}

function ContactForm() {
  const { t } = useTranslation();
  return (
    <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
      <div>
        <InputText
          title={t("front.contact.firstName")}
          required
          type="text"
          name="first_name"
          id="first_name"
          autoComplete="given-name"
          defaultValue=""
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF4500] focus:ring-[#FF4500] sm:text-sm"
        />
      </div>
      <div>
        <InputText
          title={t("front.contact.lastName")}
          type="text"
          name="last_name"
          id="last_name"
          autoComplete="family-name"
          defaultValue=""
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF4500] focus:ring-[#FF4500] sm:text-sm"
        />
      </div>

      <div className="sm:col-span-2">
        <InputText
          title={t("front.contact.email")}
          required
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue=""
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF4500] focus:ring-[#FF4500] sm:text-sm"
        />
      </div>

      <div>
        <InputText
          title={t("front.contact.organization")}
          type="text"
          name="company"
          id="company"
          autoComplete="organization"
          defaultValue=""
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF4500] focus:ring-[#FF4500] sm:text-sm"
        />
      </div>

      <div>
        <InputText
          title={t("front.contact.jobTitle")}
          type="text"
          name="jobTitle"
          id="organization-title"
          autoComplete="organization-title"
          defaultValue=""
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF4500] focus:ring-[#FF4500] sm:text-sm"
        />
      </div>

      <div className="sm:col-span-2">
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700">{t("front.contact.users")}</legend>
          <div className="mt-1">
            <InputSelect
              name="users"
              required
              options={["1", "2 - 3", "4 - 10", "11 - 25", "26 - 50", "51 - 100", "+100"].map((option) => ({
                name: option,
                value: option,
              }))}
              defaultValue="1"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF4500] focus:ring-[#FF4500] sm:text-sm"
            />
          </div>
        </fieldset>
      </div>

      <div className="sm:col-span-2">
        <InputText
          title={t("front.contact.comments")}
          required
          id="comments"
          name="comments"
          rows={4}
          defaultValue=""
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#FF4500] focus:ring-[#FF4500] sm:text-sm"
        />
      </div>

      <div className="sm:col-span-2 text-right">
        <ButtonPrimary 
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-[#FF4500] px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-[#FF4500]/90 focus:outline-none focus:ring-2 focus:ring-[#FF4500] focus:ring-offset-2 sm:text-sm"
        >
          {t("front.contact.send")}
        </ButtonPrimary>
      </div>
    </div>
  );
}
