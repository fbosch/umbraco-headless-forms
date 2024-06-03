import { validateConditionRules } from "./predicates";
import type {
  UmbracoFormConfig,
  FormDto,
  DtoWithCondition,
  EvaluatedCondition,
} from "./types";

export function exhaustiveCheck(value: never): never {
  throw new Error("Exhaustive check failed for value: " + value);
}

/** Returns all fields in the form in a flat array */
export function getAllFields(form: FormDto) {
  return form?.pages?.flatMap((page) =>
    page?.fieldsets?.flatMap((fieldset) =>
      fieldset?.columns?.flatMap((column) => column.fields),
    ),
  );
}

export function getFieldById(form: FormDto, id?: string) {
  return getAllFields(form)?.find((field) => field?.id === id);
}

/** get evaluated condition rules for a given page, fieldset or field */
export function evaluateCondition(
  dto: DtoWithCondition,
  form: FormDto,
  formData: FormData | undefined,
  config: UmbracoFormConfig,
): EvaluatedCondition {
  const isFulfilled = validateConditionRules(dto, form, formData, config);

  if (dto?.condition?.actionType === "Show") {
    return {
      show: isFulfilled,
      hide: !isFulfilled,
      isFulfilled,
    };
  }
  if (dto?.condition?.actionType === "Hide") {
    return {
      show: !isFulfilled,
      hide: isFulfilled,
      isFulfilled,
    };
  }

  return {
    show: true,
    hide: false,
    isFulfilled: true,
  };
}
