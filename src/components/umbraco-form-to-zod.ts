import type { UmbracoFormDefinition, FormFieldDto } from "./umbraco-form.types";
import { z } from "zod";

function mapFieldToZod(field: FormFieldDto): z.ZodTypeAny {
  let zodType;
  const type = field.type.name;

  switch (type) {
    case "Short answer":
    case "Long answer":
    case "File upload":
    case "Multiple choice":
    case "Dropdown":
      zodType = z.string({
        required_error: field.requiredErrorMessage ?? "Required",
      });
      if (field.pattern) {
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
        required_error: field.requiredErrorMessage ?? "Required",
      });
      break;
    default:
      throw new Error(`Unsupported field type: ${type}`);
  }

  if (field.required === false) {
    zodType = zodType.optional();
  }

  return zodType;
}

export function umbracoFormToZod(form: UmbracoFormDefinition): z.ZodSchema {
  const fields = form.pages.flatMap((page) =>
    page.fieldsets.flatMap((fieldset) =>
      fieldset.columns.flatMap((column) => column.fields),
    ),
  );

  const mappedFields = fields.reduce((acc, field) => {
    return {
      ...acc,
      [field.alias]: mapFieldToZod(field),
    };
  }, {});

  const schema = z.object({
    ...mappedFields,
  });

  console.log(schema);
  console.log(mappedFields);

  return schema;
}
