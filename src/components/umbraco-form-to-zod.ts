import { z } from "zod";
import { match } from "ts-pattern";
import {
  filterFieldsByConditions,
  getAllFields,
  getFieldByZodIssue,
} from "./field-utils";
import { FieldTypeEnum, type FormFieldDto, type FormDto } from "./types";

/** convert a form field definition to a zod type */
export type MapFormFieldToZodFn = (field?: FormFieldDto) => z.ZodTypeAny;

/** converts an umbraco form definition to a zod schema
 * @see https://docs.umbraco.com/umbraco-forms/developer/ajaxforms#requesting-a-form-definition */
export function umbracoFormToZod(
  form: FormDto,
  mapCustomFieldToZodType?: MapFormFieldToZodFn,
) {
  const fields = form?.pages?.flatMap((page) =>
    page?.fieldsets?.flatMap((fieldset) =>
      fieldset?.columns?.flatMap((column) => column.fields),
    ),
  );

  const mappedFields = fields?.reduce<Record<string, z.ZodTypeAny>>(
    (acc, field) => {
      if (field?.type?.id === FieldTypeEnum.TitleAndDescription) return acc; // skip title and description fields
      if (!field?.alias) return acc;
      return {
        ...acc,
        [field.alias]: mapFieldToZod(field, mapCustomFieldToZodType),
      };
    },
    {},
  );

  return z.object({ ...mappedFields }).transform((value) =>
    // don't validate form fields that are not visible due to condition somewhere in the form definition
    omitFieldsBasedOnConditionFromData(form, value, mapCustomFieldToZodType),
  );
}

/** map umbraco form fields to zod type */
export function mapFieldToZod(
  field: FormFieldDto,
  mapCustomFieldToZodType?: MapFormFieldToZodFn,
): z.ZodTypeAny {
  let zodType;

  match(field?.type?.id.toLowerCase())
    .with(
      FieldTypeEnum.ShortAnswer,
      FieldTypeEnum.LongAnswer,
      FieldTypeEnum.FileUpload,
      FieldTypeEnum.DropdownList,
      FieldTypeEnum.SingleChoice,
      () => {
        zodType = z.string({
          required_error: field?.requiredErrorMessage,
          coerce: true,
        });
        if (field?.required) {
          zodType = zodType.min(1, field?.requiredErrorMessage);
        }
        if ("maximumLength" in field?.settings) {
          zodType = zodType.max(
            parseInt(field?.settings.maximumLength),
            field?.patternInvalidErrorMessage,
          );
        }
        if (field?.pattern) {
          const regex = new RegExp(field.pattern);
          zodType = zodType.refine((value) => regex.test(value), {
            message: field.patternInvalidErrorMessage,
          });
        }
      },
    )
    .with(FieldTypeEnum.MultipleChoice, () => {
      zodType = z.array(z.string());
    })
    .with(FieldTypeEnum.Date, () => {
      zodType = z.string().date();
    })
    .with(
      FieldTypeEnum.Checkbox,
      FieldTypeEnum.DataConsent,
      FieldTypeEnum.Recaptcha2,
      FieldTypeEnum.RecaptchaV3WithScore,
      () => {
        zodType = z.boolean({
          coerce: true,
        });
        if (field?.required) {
          zodType = zodType.refine((value) => value === true, {
            message: field?.requiredErrorMessage,
          });
          return zodType;
        }
      },
    )
    .otherwise(() => {
      if (typeof mapCustomFieldToZodType === "function") {
        try {
          zodType = mapCustomFieldToZodType(field);
        } catch (e) {
          throw new Error(
            `Zod mapping failed for custom field: ${field?.type?.name} (${field?.type?.id})`,
          );
        }
      }
    });

  if (!zodType)
    throw new TypeError(
      `Mapped zod type is undefined for field: ${field?.type?.name} (${field?.type?.id})`,
    );

  if (!field?.required) {
    zodType = (zodType as z.ZodType).optional();
  }

  return zodType;
}

export function getIssueId(
  field: FormFieldDto | undefined,
  issue: z.ZodIssue | undefined,
) {
  return "issue:" + issue?.code + ":" + field?.id;
}

export function sortZodIssuesByFieldAlias(form: FormDto, issues: z.ZodIssue[]) {
  const allFields = getAllFields(form);
  const fieldPaths = allFields?.map((field) => field?.alias);

  return issues?.sort((a, b) => {
    if (!a || !b) return 0;
    const aPath = fieldPaths?.indexOf(getFieldByZodIssue(form, a)?.alias);
    const bPath = fieldPaths?.indexOf(getFieldByZodIssue(form, b)?.alias);
    if (aPath === undefined || bPath === undefined) return 0;
    if (aPath === bPath) {
      return a.path.join(".").localeCompare(b.path.join("."));
    }
    return aPath - bPath;
  });
}

/** omit fields from data that are not visible to the user */
export function omitFieldsBasedOnConditionFromData(
  form: FormDto,
  data: Record<string, unknown>,
  mapCustomFieldToZodType?: MapFormFieldToZodFn,
) {
  let output: Record<string, unknown> = {};
  const visibleFields = filterFieldsByConditions(
    form,
    data,
    mapCustomFieldToZodType,
  );
  visibleFields.forEach((field) => {
    if (field.alias) {
      output[field.alias] = data[field.alias];
    }
  });
  return output;
}

/** coerces form data to a zod schema format */
export function coerceFormData(
  formData: FormData | undefined,
  schema: ReturnType<typeof umbracoFormToZod>,
): Record<string, unknown> {
  let output = {};

  if (!formData) return output;
  const baseDef = findBaseDef<z.ZodObject<Record<string, any>>>(schema);

  for (let key of Object.keys(baseDef.shape)) {
    const zodType = baseDef.shape[key];
    parseParams(
      output,
      schema,
      key,
      isZodArrayType(zodType) ? formData.getAll(key) : formData.get(key),
    );
  }

  return output;
}

/** coerces an umbraco condition rule value value based on a zod type */
export function coerceRuleValue(def: z.ZodTypeAny, value: unknown): any {
  const baseShape = findBaseDef(def);

  if (baseShape instanceof z.ZodBoolean) {
    // "on"/"off" should translate to true/false in zod
    if (typeof value === "string") {
      switch (value) {
        case "true":
        case "on":
          return true;
        case "false":
        case "off":
          return false;
      }
    }
    return !!value; // coerce to boolean
  }
  return value;
}

/** recursively find the base definition for a given ZodType */
function findBaseDef<R extends z.ZodTypeAny>(def: z.ZodTypeAny) {
  if (def instanceof z.ZodOptional || def instanceof z.ZodDefault) {
    return findBaseDef(def._def.innerType);
  } else if (def instanceof z.ZodArray) {
    return findBaseDef(def.element);
  } else if (def instanceof z.ZodEffects) {
    return findBaseDef(def._def.schema);
  }
  return def as R;
}

function isZodArrayType(def: z.ZodTypeAny): def is z.ZodArray<z.ZodTypeAny> {
  if (def instanceof z.ZodOptional || def instanceof z.ZodDefault) {
    return isZodArrayType(def._def.innerType);
  } else if (def instanceof z.ZodArray) {
    return true;
  } else if (def instanceof z.ZodEffects) {
    return isZodArrayType(def._def.schema);
  }
  return false;
}

function processDef(def: z.ZodTypeAny, o: any, key: string, value: string) {
  let parsedValue: any;
  if (def instanceof z.ZodString || def instanceof z.ZodLiteral) {
    parsedValue = value;
  } else if (def instanceof z.ZodNumber) {
    const num = Number(value);
    parsedValue = isNaN(num) ? value : num;
  } else if (def instanceof z.ZodDate) {
    const date = Date.parse(value);
    parsedValue = isNaN(date) ? value : new Date(date);
  } else if (def instanceof z.ZodBoolean) {
    parsedValue =
      value === "true" || value === ""
        ? true
        : value === "false"
          ? false
          : Boolean(value);
  } else if (def instanceof z.ZodNativeEnum || def instanceof z.ZodEnum) {
    parsedValue = value;
  } else if (def instanceof z.ZodOptional || def instanceof z.ZodDefault) {
    // def._def.innerType is the same as ZodOptional's .unwrap(), which unfortunately doesn't exist on ZodDefault
    processDef(def._def.innerType, o, key, value);
    // return here to prevent overwriting the result of the recursive call
    return;
  } else if (def instanceof z.ZodArray) {
    if (o[key] === undefined) {
      o[key] = [];
    }
    processDef(def.element, o, key, value);
    // return here since recursive call will add to array
    return;
  } else if (def instanceof z.ZodEffects) {
    processDef(def._def.schema, o, key, value);
    return;
  } else {
    throw new Error(`Unexpected type ${def._def.typeName} for key ${key}`);
  }

  if (Array.isArray(o[key]) && !Array.isArray(parsedValue)) {
    o[key].push(parsedValue);
  } else {
    o[key] = parsedValue;
  }
}

function parseParams(o: any, schema: any, key: string, value: any) {
  // find actual shape definition for this key
  let shape = schema;
  while (shape instanceof z.ZodObject || shape instanceof z.ZodEffects) {
    shape =
      shape instanceof z.ZodObject
        ? shape.shape
        : shape instanceof z.ZodEffects
          ? shape._def.schema
          : null;
    if (shape === null) {
      throw new Error(`Could not find shape for key ${key}`);
    }
  }

  if (key.includes(".")) {
    let [parentProp, ...rest] = key.split(".");
    o[parentProp] = o[parentProp] ?? {};
    parseParams(o[parentProp], shape[parentProp], rest.join("."), value);
    return;
  }
  let isArray = false;
  if (key.includes("[]")) {
    isArray = true;
    key = key.replace("[]", "");
  }
  const def = shape[key];
  if (def) {
    processDef(def, o, key, value);
  }
}
