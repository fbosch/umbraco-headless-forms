import { z } from "zod";
import { umbracoFormToZod } from "./umbraco-form-to-zod";
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

export type BaseSchema = z.infer<ReturnType<typeof umbracoFormToZod>>;

export type DtoWithCondition = FormPageDto | FormFieldsetDto | FormFieldDto;

export type EvaluatedCondition = {
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

export type ValidationConfig = {
  native: boolean;
  enabled: boolean;
  on: "submit" | "change";
};

export type UmbracoFormConfig = {
  schema: ReturnType<typeof umbracoFormToZod>;
  mapCustomFieldToZodType?: MapFormFieldToZod;
  enableNativeValidation?: boolean;
  validation?: Partial<ValidationConfig>;
};

export type FormContext = {
  form: FormDto;
  formData: FormData | undefined;
  config: UmbracoFormConfig;
  submitAttempts: number;
};

export type RenderProps = {
  children: React.ReactNode;
  context: FormContext;
} & (
  | { page: FormPageDto; condition: EvaluatedCondition }
  | { fieldset: FormFieldsetDto; condition: EvaluatedCondition }
  | { column: FormFieldsetColumnDto }
  | { field: FormFieldDto; condition: EvaluatedCondition }
);

export type FormProps = {
  form: FormDto;
} & React.FormHTMLAttributes<HTMLFormElement>;

export type PageProps = RenderProps & {
  page: FormPageDto;
  condition: EvaluatedCondition;
};

export type FieldsetProps = RenderProps & {
  fieldset: FormFieldsetDto;
  condition: EvaluatedCondition;
};

export type ColumnProps = RenderProps & {
  column: FormFieldsetColumnDto;
};

export type FieldProps = RenderProps & {
  field: FormFieldDto;
  condition: EvaluatedCondition;
  issues?: z.ZodIssue[];
};

export type InputProps = Omit<FieldProps, "children" | "condition">;

export type SubmitButtonProps = { context: FormContext };
