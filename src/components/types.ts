import type { components } from "./umbraco-form.d.ts";

export type FormDto = components["schemas"]["FormDto"];
export type FormPageDto = components["schemas"]["FormPageDto"];
export type FormFieldsetDto = components["schemas"]["FormFieldsetDto"];
export type FormFieldsetColumnDto =
  components["schemas"]["FormFieldsetColumnDto"];
export type FormFieldDto = components["schemas"]["FormFieldDto"];
export type FormFieldTypeDto = components["schemas"]["FormFieldTypeDto"];
export type FormConditionDto = components["schemas"]["FormConditionDto"];

export type DefaultFormFieldTypeName =
  | "Short answer"
  | "Long answer"
  | "Checkbox"
  | "Dropdown"
  | "Multiple choice"
  | "Data Consent"
  | "File upload"
  | "Recaptcha2"
  | "Recaptcha v3 with score";
