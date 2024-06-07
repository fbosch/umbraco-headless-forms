import { match } from "ts-pattern";
import { isConditionFulfilled } from "./predicates";
import type {
  FormFieldDto,
  FormDto,
  FormPageDto,
  DtoWithCondition,
  UmbracoFormFieldSettingsMap,
  MapFormFieldToZod,
  UmbracoFormContext,
} from "./types";
import { z } from "zod";
import { getIssueId } from "./umbraco-form-to-zod";

export function exhaustiveCheck(value: never): never {
  throw new Error("Exhaustive check failed for value: " + value);
}

const cachedForms = new WeakSet<FormDto>();
const cachedFieldsById = new WeakMap<FormDto, Map<string, FormFieldDto>>();
const cachedFieldsByAlias = new WeakMap<FormDto, Map<string, FormFieldDto>>();
const cachedFieldsByPage = new WeakMap<FormPageDto, FormFieldDto[]>();

/** Returns all fields in the form definition as a flat array */
export function getAllFields(form: FormDto) {
  if (cachedForms.has(form)) {
    return Array.from(cachedFieldsById.get(form)?.values() ?? []);
  }
  const flattenedFields = form?.pages
    ?.flatMap((page) => {
      return page?.fieldsets
        ?.flatMap((fieldset) =>
          fieldset?.columns?.flatMap((column) => {
            cachedFieldsByPage.set(page, column.fields ?? []);
            return column.fields;
          }),
        )
        .filter(Boolean) as FormFieldDto[];
    })
    .filter(Boolean) as FormFieldDto[];
  const idMap = new Map<string, FormFieldDto>();
  const aliasMap = new Map<string, FormFieldDto>();
  flattenedFields.forEach((field) => {
    if (field.id) idMap.set(field.id, field);
    if (field.alias) aliasMap.set(field.alias, field);
  });
  cachedFieldsById.set(form, idMap);
  cachedForms.add(form);
  return flattenedFields;
}

export function getFieldById(form: FormDto, id: string) {
  if (cachedFieldsById.has(form)) {
    return cachedFieldsById.get(form)?.get(id);
  }
  return getAllFields(form)?.find((field) => field?.id === id);
}

export function getFieldByAlias(form: FormDto, alias: string) {
  if (cachedFieldsByAlias.has(form)) {
    return cachedFieldsByAlias.get(form)?.get(alias);
  }
  return getAllFields(form)?.find((field) => field?.alias === alias);
}

export function getAllFieldsOnPage(page?: FormPageDto) {
  if (page && cachedFieldsByPage.has(page)) {
    return cachedFieldsByPage.get(page);
  }
  return (
    page?.fieldsets
      ?.flatMap((fieldset) => fieldset?.columns)
      ?.flatMap((column) => column?.fields) ?? []
  );
}

export function getFieldByZodIssue(form: FormDto, issue: z.ZodIssue) {
  const alias = issue.path.join(".");
  return getFieldByAlias(form, alias);
}

/** walks the form definition and returns all fields that are visible to the user */
export function filterFieldsByConditions(
  form: FormDto,
  data: Record<string, unknown>,
  mapCustomFieldToZodType?: MapFormFieldToZod,
): FormFieldDto[] {
  const checkCondition = (dto?: DtoWithCondition) =>
    dto
      ? isConditionFulfilled(dto, form, data, mapCustomFieldToZodType)
      : false;

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
  context: UmbracoFormContext,
) {
  const { hideFieldValidation, showValidationSummary } = context.form;
  const { shouldValidate, shouldUseNativeValidation } = context.config;
  const hasIssues = issues && issues?.length > 0;

  const rendersOnlySummary =
    showValidationSummary === true && hideFieldValidation === true;
  const rendersOnlyLabelError =
    showValidationSummary === false && hideFieldValidation === false;

  const errorsAreHidden =
    showValidationSummary === false && hideFieldValidation === true;

  const commonAttributes: CommonAttributes = {
    name: field.alias,
    id: field.id,
    required:
      shouldValidate && shouldUseNativeValidation && field.required
        ? field.required
        : undefined,
    ["aria-invalid"]: shouldValidate ? hasIssues : undefined,
    ["aria-errormessage"]:
      // only adds error message if no error elements are present in the DOM
      shouldValidate && hasIssues && errorsAreHidden
        ? issues.at(0)?.message
        : undefined,
    // show only aria-describedby if error elements are present in the DOM
    ["aria-describedby"]:
      shouldValidate &&
      hasIssues &&
      (rendersOnlySummary || rendersOnlyLabelError)
        ? getIssueId(field, issues.at(0))
        : undefined,
  };

  const defaultValue =
    "defaultValue" in field.settings ? field.settings.defaultValue : undefined;

  const textAttributes = match(field?.type?.name)
    .with("Short answer", "Long answer", (typeName) => {
      const settings =
        field?.settings as UmbracoFormFieldSettingsMap[typeof typeName];
      return {
        autoComplete: settings?.autocompleteAttribute || undefined,
        placeholder: field.placeholder || undefined,
        pattern:
          shouldValidate && shouldUseNativeValidation && field.pattern
            ? field.pattern
            : undefined,
        maxLength:
          shouldValidate && shouldUseNativeValidation && settings?.maximumLength
            ? parseInt(settings?.maximumLength)
            : undefined,
      };
    })
    .otherwise(() => {});

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
