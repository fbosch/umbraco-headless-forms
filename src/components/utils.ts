import { match } from "ts-pattern";
import { isConditionFulfilled } from "./predicates";
import type {
  FormShape,
  FormFieldDto,
  UmbracoFormConfig,
  FormDto,
  FormPageDto,
  DtoWithCondition,
  UmbracoFormFieldSettingsMap,
} from "./types";
import { z } from "zod";

export function exhaustiveCheck(value: never): never {
  throw new Error("Exhaustive check failed for value: " + value);
}

/** Returns all fields in the form definition as a flat array */
export function getAllFields(form: FormDto) {
  return form?.pages?.flatMap((page) =>
    page?.fieldsets?.flatMap((fieldset) =>
      fieldset?.columns?.flatMap((column) => column.fields),
    ),
  );
}

/** get a field by id */
export function getFieldById(
  form: FormDto,
  id?: string,
): FormFieldDto | undefined {
  return getAllFields(form)?.find((field) => field?.id === id);
}

export function getFieldByAlias(
  form: FormDto,
  alias?: string,
): FormFieldDto | undefined {
  return getAllFields(form)?.find((field) => field?.alias === alias);
}

export function getAllFieldsOnPage(page?: FormPageDto) {
  return (
    page?.fieldsets
      ?.flatMap((fieldset) => fieldset?.columns)
      ?.flatMap((column) => column?.fields) ?? []
  );
}

/** walks the form definition and returns all fields that are visible to the user */
export function filterFieldsByConditions<TData extends FormShape>(
  form: FormDto,
  data: TData,
  config: UmbracoFormConfig,
): FormFieldDto[] {
  const checkCondition = (dto?: DtoWithCondition) =>
    dto ? isConditionFulfilled(dto, form, data, config) : false;

  return form?.pages
    ?.filter(checkCondition)
    ?.flatMap((page) => page?.fieldsets)
    ?.filter(checkCondition)
    ?.flatMap((fieldset) => fieldset?.columns)
    ?.flatMap((column) => column?.fields)
    ?.filter(checkCondition) as FormFieldDto[];
}

type CommonAttributes = React.InputHTMLAttributes<HTMLInputElement> &
  React.TextareaHTMLAttributes<HTMLTextAreaElement> &
  React.SelectHTMLAttributes<HTMLSelectElement>;

export function getAttributesForFieldType(
  field: FormFieldDto,
  issues: z.ZodIssue[] | undefined,
  config: UmbracoFormConfig,
) {
  const { shouldValidate, shouldUseNativeValidation } = config;
  const hasIssues = issues && issues?.length > 0;
  const validate = shouldValidate && shouldUseNativeValidation;

  const commonAttributes: CommonAttributes = {
    name: field.alias,
    id: field.id,
    required: validate && field.required ? field.required : undefined,
    ["aria-invalid"]: validate ? hasIssues : undefined,
    ["aria-errormessage"]:
      validate && hasIssues ? issues.at(0)?.message : undefined,
  };

  const defaultValue = match(field?.type?.name)
    .with(
      "Short answer",
      "Long answer",
      "Checkbox",
      "Multiple choice",
      "Dropdown",
      (typeName) => {
        const settings =
          field?.settings as UmbracoFormFieldSettingsMap[typeof typeName];

        return settings?.defaultValue || undefined;
      },
    )
    .otherwise(() => undefined);

  const textAttributes = match(field?.type?.name).with(
    "Short answer",
    "Long answer",
    (typeName) => {
      const settings =
        field?.settings as UmbracoFormFieldSettingsMap[typeof typeName];
      return {
        autoComplete: settings?.autocompleteAttribute || undefined,
        placeholder: field.placeholder || undefined,
        pattern: validate && field.pattern ? field.pattern : undefined,
        maxLength:
          validate && settings?.maximumLength
            ? parseInt(settings?.maximumLength)
            : undefined,
      };
    },
  );

  return match(field?.type?.name)
    .with("Short answer", (typeName) => {
      const settings =
        field?.settings as UmbracoFormFieldSettingsMap[typeof typeName];
      return {
        type: settings?.fieldType || "text",
        ...commonAttributes,
        defaultValue,
        ...textAttributes,
      } satisfies React.InputHTMLAttributes<HTMLInputElement>;
    })
    .with("Long answer", (typeName) => {
      const settings =
        field?.settings as UmbracoFormFieldSettingsMap[typeof typeName];
      return {
        defaultValue,
        ...textAttributes,
        ...commonAttributes,
        rows: settings?.numberOfRows
          ? parseInt(settings.numberOfRows)
          : undefined,
      } satisfies React.TextareaHTMLAttributes<HTMLTextAreaElement>;
    })
    .with("Multiple choice", () => ({
      type: "radio",
      ...commonAttributes,
    }))
    .with(
      "Checkbox",
      "Data Consent",
      () =>
        ({
          type: "checkbox",
          defaultChecked: !!defaultValue,
          ...commonAttributes,
        }) satisfies React.InputHTMLAttributes<HTMLInputElement>,
    )
    .with(
      "Recaptcha2",
      "Recaptcha v3 with score",
      () =>
        ({
          type: "hidden",
          ...commonAttributes,
        }) satisfies React.InputHTMLAttributes<HTMLInputElement>,
    )
    .with("Dropdown", (typeName) => {
      const settings =
        field?.settings as UmbracoFormFieldSettingsMap[typeof typeName];
      return {
        defaultValue,
        ...commonAttributes,
        multiple: !!settings?.allowMultipleSelections ?? false,
      } satisfies React.SelectHTMLAttributes<HTMLSelectElement>;
    })
    .with(
      "File upload",
      () =>
        ({
          type: "file",
          ...commonAttributes,
          accept: field?.fileUploadOptions?.allowedUploadExtensions?.join(","),
        }) satisfies React.InputHTMLAttributes<HTMLInputElement>,
    )
    .otherwise(() => commonAttributes);
}
