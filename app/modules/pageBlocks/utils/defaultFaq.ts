import { TFunction } from "i18next";
import { FaqItemDto } from "../components/blocks/marketing/faq/FaqBlockUtils";

export function defaultFaq({ t }: { t: TFunction }): FaqItemDto[] {
  const items: FaqItemDto[] = [
    {
      question: t("front.faq.questions.q1"),
      answer: t("front.faq.questions.a1"),
    },
    {
      question: t("front.faq.questions.q2"),
      answer: t("front.faq.questions.a2"),
    },
    {
      question: t("front.faq.questions.q3"),
      answer: t("front.faq.questions.a3"),
    },
    {
      question: t("front.faq.questions.q4"),
      answer: t("front.faq.questions.a4"),
    },
    {
      question: t("front.faq.questions.q5"),
      answer: t("front.faq.questions.a5"),
    },
    {
      question: t("front.faq.questions.q6"),
      answer: t("front.faq.questions.a6"),
    },
    {
      question: t("front.faq.questions.q7"),
      answer: t("front.faq.questions.a7"),
    },
    {
      question: t("front.faq.questions.q8"),
      answer: t("front.faq.questions.a8"),
    }
  ];
  return items;
}
