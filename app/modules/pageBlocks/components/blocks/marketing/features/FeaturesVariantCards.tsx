import { useTranslation } from "react-i18next";
import { FeatureDto, FeaturesBlockDto } from "~/modules/pageBlocks/components/blocks/marketing/features/FeaturesBlockUtils";
import CheckIcon from "~/components/ui/icons/CheckIcon";
import { Fragment } from "react";
import GridBlockUtils from "../../shared/grid/GridBlockUtils";
import ButtonEvent from "~/components/ui/buttons/ButtonEvent";
import clsx from "clsx";
import { ExternalLinkIcon } from "lucide-react";
import "./FeatureCard.css";

export default function FeaturesVariantCards({ item }: { item: FeaturesBlockDto }) {
  const { t } = useTranslation();
  return (
    <div>
      <section id="features" className="body-font">
        <div className="container mx-auto max-w-5xl space-y-8 px-5 py-12 sm:space-y-12">
          <div
            className={clsx(
              "space-y-5",
              (!item.position || item.position === "center") && "text-center sm:mx-auto sm:max-w-xl sm:space-y-4 lg:max-w-5xl",
              item.position === "left" && "text-left",
              item.position === "right" && "text-right"
            )}
          >
            <div className="space-y-1">
              {item.topText && <div className="text-sm font-semibold uppercase leading-8">{t(item.topText)}</div>}
              {item.title && <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t(item.title)}</h1>}
              {item.headline && <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t(item.headline)}</h2>}
            </div>
            {item.subheadline && (
              <Fragment>
                {item.title ? <h2 className="mx-auto text-xl">{t(item.subheadline)}</h2> : <p className="mx-auto text-xl">{t(item.subheadline)}</p>}
              </Fragment>
            )}

            <div
              className={clsx(
                "mt-8 flex flex-wrap gap-4",
                item.position === "left" && "justify-start",
                (!item.position || item.position === "center") && "justify-center",
                item.position === "right" && "justify-end"
              )}
            >
              {item.cta?.map((item, idx) => {
                return (
                  <ButtonEvent
                    key={idx}
                    to={item.href}
                    target={item.target}
                    className={clsx(
                      "flex w-full items-center space-x-2 sm:w-auto",
                      item.isPrimary
                        ? "bg-primary hover:bg-primary/95 text-primary-foreground inline-flex justify-center rounded-md border-0 px-2 py-1 text-base shadow-sm focus:outline-none"
                        : "bg-secondary hover:bg-secondary/95 text-secondary-foreground inline-flex justify-center rounded-md border-0 px-2 py-1 text-base shadow-sm focus:outline-none"
                    )}
                    event={{ action: "click", category: "features", label: item.text ?? "", value: item.href ?? "" }}
                  >
                    {t(item.text)} {item.icon === "external" && <ExternalLinkIcon className="h-4" />}
                  </ButtonEvent>
                );
              })}
            </div>
          </div>

          <div className={GridBlockUtils.getClasses(item.grid)}>
            {item.items.map((feature, idx) => {
              return (
                <Fragment key={idx}>
                  {feature.link ? (
                    <ButtonEvent
                      to={feature.link.href}
                      target={feature.link.target}
                      className={clsx(
                        "feature-card",
                        feature.theme || "gradient-orange",
                        "hover:transform hover:transition-all hover:duration-300"
                      )}
                      event={{ action: "click", category: "features", label: t(feature.name), value: feature.link.href }}
                    >
                      <FeatureCard feature={feature} />
                    </ButtonEvent>
                  ) : (
                    <div className={clsx(
                      "feature-card",
                      feature.theme || "gradient-orange"
                    )}>
                      <FeatureCard feature={feature} />
                    </div>
                  )}
                </Fragment>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ feature }: { feature: FeatureDto }) {
  const { t } = useTranslation();
  return (
    <>
      <div className="mb-4 flex items-center justify-between space-x-2">
        {feature.highlight && (
          <span className="feature-card-highlight">
            {t(feature.highlight.text)}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between space-x-2 mb-4">
        <div className="flex items-center truncate">
          <div className="feature-card-icon mr-3 inline-flex flex-shrink-0 items-center justify-center">
            {feature.icon ? (
              <>
                {feature.icon.startsWith("<svg") ? (
                  <div dangerouslySetInnerHTML={{ __html: feature.icon.replace("<svg", `<svg class='${" h-6 w-6"}'`) ?? "" }} />
                ) : feature.icon.startsWith("http") ? (
                  <img className="h-6 w-6" src={feature.icon} alt={feature.name} />
                ) : (
                  <span className="text-2xl">{feature.icon}</span>
                )}
              </>
            ) : (
              <CheckIcon className="h-6 w-6" aria-hidden="true" />
            )}
          </div>
          <h2 className="feature-card-title">{t(feature.name)}</h2>
        </div>
      </div>
      <div className="flex-grow">
        <p className="feature-card-description">{t(feature.description)}</p>
        {feature.subFeatures && feature.subFeatures.length > 0 && (
          <ul className="mt-4 space-y-2">
            {feature.subFeatures.map((subFeature, idx) => (
              <li key={idx} className="flex items-center text-sm">
                <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
                {t(subFeature.name)}
              </li>
            ))}
          </ul>
        )}
        {feature.link && (
          <a href={feature.link.href} className="feature-card-link">
            {t(feature.link.text)}
            <ExternalLinkIcon className="ml-1 h-4 w-4" />
          </a>
        )}
      </div>
    </>
  );
}
