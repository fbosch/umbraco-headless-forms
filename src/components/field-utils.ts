import { match } from "ts-pattern";
import { isConditionFulfilled } from "./conditions";
import {
  type FormFieldDto,
  type FormDto,
  type FormPageDto,
  type DtoWithCondition,
  type FieldSettings,
  DefaultFieldType,
  UmbracoFormConfig,
} from "./types";
import { z } from "zod";
import { getIssueId, type MapFormFieldToZodFn } from "./umbraco-form-to-zod";

const cachedForms = new WeakSet<FormDto>();
const cachedFieldsById = new WeakMap<FormDto, Map<string, FormFieldDto>>();
const cachedFieldsByAlias = new WeakMap<FormDto, Map<string, FormFieldDto>>();
const cachedFieldsByPage = new WeakMap<FormPageDto, FormFieldDto[]>();

/**
 * Retrieves all fields from a given form.
 * If the form's fields are already cached, it returns them from the cache.
 * Otherwise, it flattens the fields from all pages, fieldsets, and columns,
 * caches them, and then returns the flattened list of fields.
 *
 * @param {FormDto} form - The form definition to retrieve fields from.
 * @returns {FormFieldDto[]} An array of form fields from the form definition.
 */
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

/**
 * Retrieves a field from a form by its id.
 * If the field is cached, it returns the cached field.
 * Otherwise, it finds the field by iterating over all fields.
 *
 * @param {FormDto} form - The form data transfer object.
 * @param {string} id - The id of the field to retrieve.
 * @returns {FieldDto | undefined} The field with the specified alias, or undefined if not found.
 */
export function getFieldById(form: FormDto, id: string) {
  if (cachedFieldsById.has(form)) {
    return cachedFieldsById.get(form)?.get(id);
  }
  return getAllFields(form)?.find((field) => field?.id === id);
}

/**
 * Retrieves a field from a form by its alias.
 * If the field is cached, it returns the cached field.
 * Otherwise, it finds the field by iterating over all fields.
 *
 * @param {FormDto} form - The form data transfer object.
 * @param {string} alias - The alias of the field to retrieve.
 * @returns {FieldDto | undefined} The field with the specified alias, or undefined if not found.
 */
export function getFieldByAlias(form: FormDto, alias: string) {
  if (cachedFieldsByAlias.has(form)) {
    return cachedFieldsByAlias.get(form)?.get(alias);
  }
  return getAllFields(form)?.find((field) => field?.alias === alias);
}

/**
 * Retrieves all fields on a given page
 * @param {FormPageDto} [page] - The page object containing fieldsets to process.
 * @returns {FormFieldDto[]} An array of form field objects.
 */
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

/**
 * Retrieves the form field associated with a given Zod validation issue.
 *
 * @param {FormDto} form - The form definition.
 * @param {z.ZodIssue} issue - The Zod issue containing the error details.
 * @returns The form field corresponding to the issue's path.
 */
export function getFieldByZodIssue(form: FormDto, issue: z.ZodIssue) {
  const alias = issue.path.join(".");
  return getFieldByAlias(form, alias);
}
/**
 * Filters form fields based on conditions.
 *
 * @param {FormDto} form - The form definition.
 * @param {Record<string, unknown>} data - The data to check against the conditions.
 * @param {MapFormFieldToZodFn} [mapCustomFieldToZodType] - Optional mapping of custom fields to Zod validation schema.
 * @returns {FormFieldDto[]} An array of form fields that meet the specified conditions.
 */
export function filterFieldsByConditions(
  form: FormDto,
  data: Record<string, unknown>,
  mapCustomFieldToZodType?: MapFormFieldToZodFn,
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
  form: FormDto,
  config: UmbracoFormConfig,
) {
  const { hideFieldValidation, showValidationSummary } = form;
  const { shouldValidate, shouldUseNativeValidation } = config;
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
        ? issues[0].message
        : undefined,
    // show only aria-describedby if error elements are present in the DOM
    ["aria-describedby"]:
      shouldValidate &&
      hasIssues &&
      (rendersOnlySummary || rendersOnlyLabelError)
        ? getIssueId(field, issues[0])
        : undefined,
  };

  const defaultValue =
    "defaultValue" in field.settings ? field.settings.defaultValue : undefined;

  const textAttributes = match(field?.type?.id)
    .with(DefaultFieldType.ShortAnswer, DefaultFieldType.LongAnswer, (id) => {
      const settings = field?.settings as FieldSettings[typeof id];
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

  return match(field?.type?.id.toLowerCase())
    .with(DefaultFieldType.ShortAnswer, (id) => {
      const settings = field?.settings as FieldSettings[typeof id];
      return {
        type: settings?.fieldType || "text",
        ...commonAttributes,
        defaultValue,
        ...textAttributes,
      } satisfies React.InputHTMLAttributes<HTMLInputElement>;
    })
    .with(DefaultFieldType.LongAnswer, (id) => {
      const settings = field?.settings as FieldSettings[typeof id];
      return {
        defaultValue,
        ...textAttributes,
        ...commonAttributes,
        rows: settings?.numberOfRows
          ? parseInt(settings.numberOfRows)
          : undefined,
      } satisfies React.TextareaHTMLAttributes<HTMLTextAreaElement>;
    })
    .with(DefaultFieldType.MultipleChoice, () => ({
      type: "radio",
      ...commonAttributes,
    }))
    .with(
      DefaultFieldType.Checkbox,
      DefaultFieldType.DataConsent,
      () =>
        ({
          type: "checkbox",
          defaultChecked: !!defaultValue,
          ...commonAttributes,
        }) satisfies React.InputHTMLAttributes<HTMLInputElement>,
    )
    .with(
      DefaultFieldType.Recaptcha2,
      DefaultFieldType.RecaptchaV3WithScore,
      () =>
        ({
          type: "hidden",
          ...commonAttributes,
        }) satisfies React.InputHTMLAttributes<HTMLInputElement>,
    )
    .with(DefaultFieldType.DropdownList, (id) => {
      const settings = field?.settings as FieldSettings[typeof id];
      return {
        defaultValue,
        ...commonAttributes,
        multiple: !!settings?.allowMultipleSelections ?? false,
      } satisfies React.SelectHTMLAttributes<HTMLSelectElement>;
    })
    .with(DefaultFieldType.Date, () => ({
      type: "date",
      ...commonAttributes,
    }))
    .with(DefaultFieldType.Password, () => ({
      type: "password",
      ...commonAttributes,
    }))
    .with(DefaultFieldType.RichText, () => ({
      type: "textarea",
      ...commonAttributes,
    }))
    .with(
      DefaultFieldType.FileUpload,
      () =>
        ({
          type: "file",
          ...commonAttributes,
          accept: field?.fileUploadOptions?.allowedUploadExtensions?.join(","),
        }) satisfies React.InputHTMLAttributes<HTMLInputElement>,
    )
    .otherwise(() => commonAttributes);
}
