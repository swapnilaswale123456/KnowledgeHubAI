import { Form } from "@remix-run/react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { useTranslation } from "react-i18next";
import { Switch } from "../ui/switch";

interface IndustryFormProps {
  defaultValues?: {
    name?: string;
    description?: string;
    isEnabled?: boolean;
    icon?: string;
  };
  isEditing?: boolean;
  onSubmit?: (formData: FormData) => void;
}

export function IndustryForm({ defaultValues, isEditing, onSubmit }: IndustryFormProps) {
  const { t } = useTranslation();

  return (
    <Form 
      method="post" 
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        onSubmit?.(formData);
      }}
    >
      <div>
        <label className="text-sm font-medium">
          {t("admin.industry.name")}
        </label>
        <Input
          name="name"
          defaultValue={defaultValues?.name}
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium">
          {t("admin.industry.description")}
        </label>
        <Textarea
          name="description"
          defaultValue={defaultValues?.description}
          rows={4}
        />
      </div>
      <div>
        <label className="text-sm font-medium">
          {t("admin.industry.isEnabled")}
        </label>
        <Switch
          name="isEnabled"
          defaultChecked={defaultValues?.isEnabled}
        />
      </div>
      <div>
        <label className="text-sm font-medium">
          {t("admin.industry.icon")}
        </label>
        <Input
          name="icon"
          defaultValue={defaultValues?.icon}
        />
      </div>
      <Button type="submit">
        {isEditing ? t("common.update") : t("common.create")}
      </Button>
    </Form>
  );
} 