import { z } from "zod";
import { exhaustiveCheck } from "./utils";
import type {
  FormFieldDto,
  FormDto,
  MapFormFieldToZod,
  DefaultFormFieldTypeName,
  UmbracoFormConfig,
} from "./types";

export function mapFieldToZod(
  field?: FormFieldDto,
  config?: UmbracoFormConfig,
): z.ZodTypeAny {
  let zodType;
  const type = field?.type?.name as DefaultFormFieldTypeName;

  switch (type) {
    case "Short answer":
    case "Long answer":
    case "File upload":
    case "Multiple choice":
    case "Dropdown":
      zodType = z.string({
        required_error: field?.requiredErrorMessage ?? "Required",
      });
      if (field?.pattern) {
        const regex = new RegExp(field.pattern);
        zodType = zodType.refine((value) => regex.test(value), {
          message: field.patternInvalidErrorMessage ?? "Invalid",
        });
      }
      break;
    case "Checkbox":
    case "Data Consent":
    case "Recaptcha2":
    case "Recaptcha v3 with score":
      zodType = z.boolean({
        required_error: field?.requiredErrorMessage ?? "Required",
        coerce: true,
      });
      break;
    default:
      if (typeof config?.mapCustomFieldToZodType === "function") {
        try {
          zodType = config.mapCustomFieldToZodType(field);
          if (!zodType) throw new Error("Mapped type is undefined");
          break;
        } catch (e) {
          throw new Error(
            `Unsupported field type: ${type}, please provide configuration for mapCustomField to handle this field type`,
          );
        }
      }
      return exhaustiveCheck(type);
  }

  if (field?.required === false) {
    zodType = zodType.optional();
  }

  return zodType;
}

export type UmbracoFormToZodConfig = {
  mapCustomFieldToZodType?: MapFormFieldToZod;
};

export function umbracoFormToZod(
  form: FormDto,
  config?: UmbracoFormToZodConfig,
) {
  const fields = form?.pages?.flatMap((page) =>
    page?.fieldsets?.flatMap((fieldset) =>
      fieldset?.columns?.flatMap((column) => column.fields),
    ),
  );

  const mappedFields = fields?.reduce<Record<string, z.ZodTypeAny>>(
    (acc, field) => {
      if (!field?.alias) return acc;
      return {
        ...acc,
        [field.alias]: mapFieldToZod(field, config),
      };
    },
    {},
  );

  const schema = z.object({
    ...mappedFields,
  });
  return schema;
}
