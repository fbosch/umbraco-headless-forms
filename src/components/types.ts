import { z } from "zod";
import { umbracoFormToZod } from "./umbraco-form-to-zod";
import type { components } from "./umbraco-form.d.ts";

const DEFAULT_FORM_FIELD_TYPE_NAMES = [
  "Short answer",
  "Long answer",
  "Checkbox",
  "Dropdown",
  "Multiple choice",
  "Data Consent",
  "File upload",
  "Recaptcha2",
  "Recaptcha v3 with score",
] as const;

export type DefaultFormFieldTypeName =
  (typeof DEFAULT_FORM_FIELD_TYPE_NAMES)[number];

export interface FormDto
  extends Omit<components["schemas"]["FormDto"], "pages"> {
  pages?: FormPageDto[];
}

export interface FormPageDto
  extends Omit<components["schemas"]["FormPageDto"], "fieldsets"> {
  fieldsets?: FormFieldsetDto[];
}

export interface FormFieldsetDto
  extends Omit<components["schemas"]["FormFieldsetDto"], "columns"> {
  columns?: FormFieldsetColumnDto[];
}

export interface FormFieldsetColumnDto
  extends Omit<components["schemas"]["FormFieldsetColumnDto"], "fields"> {
  fields?: FormFieldDto[];
}

export interface FormFieldTypeDto
  extends Omit<components["schemas"]["FormFieldTypeDto"], "name"> {
  name: DefaultFormFieldTypeName;
}

export interface FormFieldDto
  extends Omit<components["schemas"]["FormFieldDto"], "type" | "settings"> {
  type: FormFieldTypeDto;
  settings?: UmbracoFormFieldSettingsMap[DefaultFormFieldTypeName];
}

export type FormConditionDto = components["schemas"]["FormConditionDto"];

export type FormConditionRuleDto =
  components["schemas"]["FormConditionRuleDto"];

export type FieldConditionActionType =
  components["schemas"]["FieldConditionActionType"];

export type FieldConditionLogicType =
  components["schemas"]["FieldConditionLogicType"];

export type FieldConditionRuleOperator =
  components["schemas"]["FieldConditionRuleOperator"];

export type DtoWithCondition = FormPageDto | FormFieldsetDto | FormFieldDto;

export interface UmbracoFormFieldSettingsMap {
  "Short answer": {
    defaultValue: string;
    placeholder: string;
    showLabel: string;
    maximumLength: string;
    fieldType: string;
    autocompleteAttribute: string;
  };
  "Long answer": {
    defaultValue: string;
    placeholder: string;
    showLabel: string;
    autocompleteAttribute: string;
    numberOfRows: string;
    maximumLength: string;
  };
  Checkbox: {
    caption: string;
    defaultValue: string;
    showLabel: string;
  };
  Dropdown: {
    defaultValue: string;
    allowMultipleSelections: string;
    showLabel: string;
    autocompleteAttribute: string;
    selectPrompt: string;
  };
  "Multiple choice": {
    defaultValue: string;
    showLabel: string;
    preValues: Array<any>;
  };
  "Data Consent": {
    acceptCopy: string;
    showLabel: string;
  };
  "File upload": {
    selectFilesListHeading: string;
  };
  Recaptcha2: {
    theme: string;
    size: string;
    errorMessage: string;
  };
  "Recaptcha v3 with score": {
    scoreThreshold: string;
    errorMessage: string;
    saveScore: string;
  };
}

export type MapFormFieldToZod = (field?: FormFieldDto) => z.ZodTypeAny;

export interface UmbracoFormConfig {
  schema: ReturnType<typeof umbracoFormToZod>;
  mapCustomFieldToZodType?: MapFormFieldToZod;
  shouldValidate?: boolean;
  shouldUseNativeValidation?: boolean;
}

export interface UmbracoFormContext {
  form: FormDto;
  formData: FormData | undefined;
  config: UmbracoFormConfig;
  submitAttempts: number;
  currentPage: number;
  totalPages: number;
}

export type RenderProps = React.HTMLAttributes<HTMLElement> &
  (
    | { page: FormPageDto; condition: boolean }
    | { fieldset: FormFieldsetDto; condition: boolean }
    | { column: FormFieldsetColumnDto }
    | { field: FormFieldDto; condition: boolean }
  );

export type FormProps = {
  form: FormDto;
} & React.FormHTMLAttributes<HTMLFormElement>;

export type PageProps = RenderProps & {
  page: FormPageDto;
  pageIndex: number;
  condition: boolean;
};

export type FieldsetProps = RenderProps & {
  fieldset: FormFieldsetDto;
  condition: boolean;
};

export type ColumnProps = RenderProps & {
  column: FormFieldsetColumnDto;
};

export type FieldProps = RenderProps & {
  field: FormFieldDto;
  condition: boolean;
  issues?: z.ZodIssue[];
};

export type InputProps = Omit<FieldProps, "children" | "condition">;
