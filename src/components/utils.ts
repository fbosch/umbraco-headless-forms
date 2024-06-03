import { areConditionsMet } from "./predicates";
import type { FormDto, DtoWithCondition, AppliedCondition } from "./types";

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

export function applyCondition(
  dto: DtoWithCondition,
  form: FormDto,
  formData?: FormData,
  config: UmbracoFormConfig = {},
): AppliedCondition {
  const isFulfilled = areConditionsMet(dto, form, formData);

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
