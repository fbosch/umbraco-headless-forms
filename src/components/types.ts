import { z } from "zod";
import type { components } from "./umbraco-form.d.ts";

/** default schema types */
export type FormDto = components["schemas"]["FormDto"];
export type FormPageDto = components["schemas"]["FormPageDto"];
export type FormFieldsetDto = components["schemas"]["FormFieldsetDto"];
export type FormFieldsetColumnDto =
  components["schemas"]["FormFieldsetColumnDto"];
export type FormFieldDto = components["schemas"]["FormFieldDto"];
export type FormFieldTypeDto = components["schemas"]["FormFieldTypeDto"];
export type FormConditionDto = components["schemas"]["FormConditionDto"];
export type FieldConditionActionType =
  components["schemas"]["FieldConditionActionType"];
export type FieldConditionLogicType =
  components["schemas"]["FieldConditionLogicType"];
export type FieldConditionRuleOperator =
  components["schemas"]["FieldConditionRuleOperator"];

export type DtoWithCondition = FormPageDto | FormFieldsetDto | FormFieldDto;
export type AppliedCondition = {
  show: boolean;
  hide: boolean;
  isFulfilled: boolean;
};

//** Form field names from default Umbraco form installation */
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

export type MapFormFieldToZod = (field?: FormFieldDto) => z.ZodTypeAny;

export type UmbracoFormConfig = {
  mapCustomFieldToZodType?: MapFormFieldToZod;
};
