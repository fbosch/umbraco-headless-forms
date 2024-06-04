import { validateConditionRules } from "./predicates";
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

/** get all fields in the form definition that are visible to the user */
export function getAllFieldsFilteredByConditions<TData extends BaseSchema>(
  form: FormDto,
  data: TData,
  config: UmbracoFormConfig,
): FormFieldDto[] {
  const checkCondition = (dto?: DtoWithCondition) =>
    dto ? evaluateCondition(dto, form, data, config) : false;

  return form?.pages
    ?.filter(checkCondition)
    ?.flatMap((page) => page?.fieldsets)
    ?.filter(checkCondition)
    ?.flatMap((fieldset) => fieldset?.columns)
    ?.flatMap((column) => column?.fields)
    ?.filter(checkCondition) as FormFieldDto[];
}

/** get evaluated condition rules for a given page, fieldset or field */
export function evaluateCondition<TData extends BaseSchema>(
  dto: DtoWithCondition,
  form: FormDto,
  data: TData,
  config: UmbracoFormConfig,
): boolean {
  const isFulfilled = validateConditionRules(dto, form, data, config);

  if (dto?.condition?.actionType === "Show") {
    return isFulfilled;
  }

  if (dto?.condition?.actionType === "Hide") {
    return !isFulfilled;
  }

  return true;
}
