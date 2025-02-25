import { Form } from "@remix-run/react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { useTranslation } from "react-i18next";
import { Switch } from "~/components/ui/switch";
import { useRef, useState } from "react";

interface ChatbotTypeFormProps {
  defaultValues?: {
    name?: string;
    description?: string;
    isEnabled?: boolean;
    icon?: string;
  };
  isEditing?: boolean;
  onSubmit?: (formData: FormData) => void;
}

export function ChatbotTypeForm({ defaultValues, isEditing, onSubmit }: ChatbotTypeFormProps) {
  const { t } = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);
  const [isEnabled, setIsEnabled] = useState(defaultValues?.isEnabled ?? false);

  return (
    <Form 
      ref={formRef}
      method="post" 
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        formData.set('isEnabled', isEnabled.toString());
        onSubmit?.(formData);
      }}
    >
      <div>
        <label className="text-sm font-medium">
          {t("admin.chatbotType.name")}
        </label>
        <Input
          name="name"
          defaultValue={defaultValues?.name}
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium">
          {t("admin.chatbotType.description")}
        </label>
        <Textarea
          name="description"
          defaultValue={defaultValues?.description}
          rows={4}
        />
      </div>

      <div>
        <label className="text-sm font-medium">
          {t("admin.chatbotType.isEnabled")}
        </label>
        <Switch
          name="isEnabled"
          checked={isEnabled}
          onCheckedChange={setIsEnabled}
        />
      </div>

      <div>
        <label className="text-sm font-medium">
          {t("admin.chatbotType.icon")}
        </label>
        <Input
          name="icon"
          defaultValue={defaultValues?.icon}
        />
      </div>

      <Button type="submit">
        {isEditing ? t("common.Update") : t("common.Create")}
      </Button>
    </Form>
  );
} 