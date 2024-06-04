import { z } from "zod";
import { exhaustiveCheck, getAllFieldsFilteredByConditions } from "./utils";
import {
  ZodLiteral,
  ZodTypeAny,
  ZodString,
  ZodNumber,
  ZodDate,
  ZodBoolean,
  ZodNativeEnum,
  ZodEnum,
  ZodOptional,
  ZodDefault,
  ZodArray,
  ZodEffects,
  ZodObject,
} from "zod";
import type {
  FormFieldDto,
  FormDto,
  DefaultFormFieldTypeName,
  UmbracoFormConfig,
  MapFormFieldToZod,
  BaseSchema,
} from "./types";

export function mapFieldToZod(
  field?: FormFieldDto,
  mapCustomFieldToZodType?: MapFormFieldToZod,
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
        required_error: field?.requiredErrorMessage,
        coerce: true,
      });
      if (field?.pattern) {
        const regex = new RegExp(field.pattern);
        zodType = zodType.refine((value) => regex.test(value), {
          message: field.patternInvalidErrorMessage,
        });
      }
      break;
    case "Checkbox":
    case "Data Consent":
    case "Recaptcha2":
    case "Recaptcha v3 with score":
      return z
        .boolean({
          coerce: true,
        })
        .refine(
          (value) => {
            if (field?.required === true) {
              return value === true;
            }
            return !!value;
          },
          {
            message: field?.requiredErrorMessage,
          },
        );
    default:
      if (typeof mapCustomFieldToZodType === "function") {
        try {
          zodType = mapCustomFieldToZodType(field);
          if (!zodType) throw new Error("Mapped type is undefined");
          break;
        } catch (e) {
          throw new Error(
            `Unsupported field type: ${type}, please provide configuration for mapCustomField`,
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

export function umbracoFormToZod(
  form: FormDto,
  config?: Omit<UmbracoFormConfig, "schema">,
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
        [field.alias]: mapFieldToZod(field, config?.mapCustomFieldToZodType),
      };
    },
    {},
  );

  return z.object({ ...mappedFields });
}

export function omitConditionalFields<TData extends BaseSchema>(
  form: FormDto,
  data: TData = {} as TData,
  config: UmbracoFormConfig,
) {
  let output: Record<string, unknown> = {};
  const allAvailableFields = getAllFieldsFilteredByConditions(
    form,
    data,
    config,
  );
  for (let key of Object.keys(data)) {
    if (allAvailableFields.find((field) => field.alias === key)) {
      output[key] = data[key];
    }
  }
  return output as Partial<TData>;
}

/** coerces form data to the schema format */
export function coerceFormData(
  formData: FormData | undefined,
  config: UmbracoFormConfig,
) {
  let output: z.infer<typeof config.schema> = {};
  if (!formData) return output;

  for (let key of Object.keys(config.schema.shape)) {
    parseParams(output, config.schema, key, formData.get(key));
  }

  return output;
}

export function coerceRuleValue(def: z.ZodTypeAny, value: unknown): any {
  const baseShape = findBaseDef(def);

  // handle specific rule values from Umbraco
  if (baseShape instanceof ZodBoolean) {
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
function findBaseDef(def: ZodTypeAny) {
  if (def instanceof ZodOptional || def instanceof ZodDefault) {
    return findBaseDef(def._def.innerType);
  } else if (def instanceof ZodArray) {
    return findBaseDef(def.element);
  } else if (def instanceof ZodEffects) {
    return findBaseDef(def._def.schema);
  }
  return def;
}

function processDef(def: ZodTypeAny, o: any, key: string, value: string) {
  let parsedValue: any;
  if (def instanceof ZodString || def instanceof ZodLiteral) {
    parsedValue = value;
  } else if (def instanceof ZodNumber) {
    const num = Number(value);
    parsedValue = isNaN(num) ? value : num;
  } else if (def instanceof ZodDate) {
    const date = Date.parse(value);
    parsedValue = isNaN(date) ? value : new Date(date);
  } else if (def instanceof ZodBoolean) {
    parsedValue =
      value === "true" || value === ""
        ? true
        : value === "false"
          ? false
          : Boolean(value);
  } else if (def instanceof ZodNativeEnum || def instanceof ZodEnum) {
    parsedValue = value;
  } else if (def instanceof ZodOptional || def instanceof ZodDefault) {
    // def._def.innerType is the same as ZodOptional's .unwrap(), which unfortunately doesn't exist on ZodDefault
    processDef(def._def.innerType, o, key, value);
    // return here to prevent overwriting the result of the recursive call
    return;
  } else if (def instanceof ZodArray) {
    if (o[key] === undefined) {
      o[key] = [];
    }
    processDef(def.element, o, key, value);
    // return here since recursive call will add to array
    return;
  } else if (def instanceof ZodEffects) {
    processDef(def._def.schema, o, key, value);
    return;
  } else {
    throw new Error(`Unexpected type ${def._def.typeName} for key ${key}`);
  }
  if (Array.isArray(o[key])) {
    o[key].push(parsedValue);
  } else {
    o[key] = parsedValue;
  }
}

function parseParams(o: any, schema: any, key: string, value: any) {
  // find actual shape definition for this key
  let shape = schema;
  while (shape instanceof ZodObject || shape instanceof ZodEffects) {
    shape =
      shape instanceof ZodObject
        ? shape.shape
        : shape instanceof ZodEffects
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
    processDef(def, o, key, value as string);
  }
}
