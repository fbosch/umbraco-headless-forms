import { isConditionFulfilled } from "./predicates";
import type {
  BaseSchema,
  FormFieldDto,
  UmbracoFormConfig,
  FormDto,
  FormPageDto,
  DtoWithCondition,
} from "./types";

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

export function getAllFieldsOnPage(page: FormPageDto): FormFieldDto[] {
  return page?.fieldsets
    ?.flatMap((fieldset) => fieldset?.columns)
    ?.flatMap((column) => column?.fields) as FormFieldDto[];
}

/** walks the form definition and returns all fields that are visible to the user */
export function filterFieldsByConditions<TData extends BaseSchema>(
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
