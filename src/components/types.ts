import {
  type MapFormFieldToZod,
  umbracoFormToZod,
} from "./umbraco-form-to-zod";
import type { components } from "./umbraco-form.d.ts";

/** constant of default form field type names
 * @see https://docs.umbraco.com/umbraco-forms/editor/creating-a-form/field-types */
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
  // TODO: implement these:
  // "Data",
  // "Password",
  // "Rich text",
  // "Single choice",
] as const;

/** Default form field type name
 * @see https://docs.umbraco.com/umbraco-forms/editor/creating-a-form/field-types */
export type DefaultFormFieldTypeName =
  (typeof DEFAULT_FORM_FIELD_TYPE_NAMES)[number];

/** Form definition
 * @see https://docs.umbraco.com/umbraco-forms/editor/creating-a-form/form-settings */
export interface FormDto
  extends Omit<components["schemas"]["FormDto"], "pages"> {
  pages?: FormPageDto[];
}

/** Form page
 * @see https://docs.umbraco.com/umbraco-forms/editor/creating-a-form#form-pages */
export interface FormPageDto
  extends Omit<components["schemas"]["FormPageDto"], "fieldsets"> {
  fieldsets?: FormFieldsetDto[];
}

/** Form groups
 * @see https://docs.umbraco.com/umbraco-forms/editor/creating-a-form#form-groups */
export interface FormFieldsetDto
  extends Omit<components["schemas"]["FormFieldsetDto"], "columns"> {
  columns?: FormFieldsetColumnDto[];
}

/** Form fieldset column
 * @see https://docs.umbraco.com/umbraco-forms/editor/creating-a-form#form-columns */
export interface FormFieldsetColumnDto
  extends Omit<components["schemas"]["FormFieldsetColumnDto"], "fields"> {
  fields?: FormFieldDto[];
}

/** Form field type
 * @see https://docs.umbraco.com/umbraco-forms/developer/configuration/type-details#field-types */
export interface FormFieldTypeDto
  extends Omit<components["schemas"]["FormFieldTypeDto"], "name"> {
  name: DefaultFormFieldTypeName;
}

/** Form field
 * @see https://docs.umbraco.com/umbraco-forms/developer/configuration/type-details#field-types */
export interface FormFieldDto
  extends Omit<components["schemas"]["FormFieldDto"], "type" | "settings"> {
  type: FormFieldTypeDto;
  settings: UmbracoFormFieldSettingsMap[DefaultFormFieldTypeName];
}

/** Form condition
 * @see https://docs.umbraco.com/umbraco-forms/editor/creating-a-form/conditional-logic */
export type FormConditionDto = components["schemas"]["FormConditionDto"];

/** Form condition rule
 * @see https://docs.umbraco.com/umbraco-forms/editor/creating-a-form/conditional-logic */
export type FormConditionRuleDto =
  components["schemas"]["FormConditionRuleDto"];

/** Field condition action type
 * @see https://docs.umbraco.com/umbraco-forms/editor/creating-a-form/conditional-logic#action-and-logic-types */
export type FieldConditionActionType =
  components["schemas"]["FieldConditionActionType"];

/** Field condition logic type
 * @see https://docs.umbraco.com/umbraco-forms/editor/creating-a-form/conditional-logic#action-and-logic-types */
export type FieldConditionLogicType =
  components["schemas"]["FieldConditionLogicType"];

/** Field condition rule operator
 * @see https://docs.umbraco.com/umbraco-forms/editor/creating-a-form/conditional-logic#adding-a-new-condition */
export type FieldConditionRuleOperator =
  components["schemas"]["FieldConditionRuleOperator"];

/** Data transfer object with conditions, includes pages, fieldsets and fields
 * @see https://docs.umbraco.com/umbraco-forms/editor/creating-a-form/conditional-logic */
export type DtoWithCondition = FormPageDto | FormFieldsetDto | FormFieldDto;

/** Field type settings
 * @see https://docs.umbraco.com/umbraco-forms/developer/configuration/type-details#field-types */
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

/** configuration for UmbracoForm component instance */
export interface UmbracoFormConfig {
  /** custom schema for form validation, defaults to umbracoFormToZod implementation */
  schema: ReturnType<typeof umbracoFormToZod>;
  /** optional custom mapping function for form fields, useful when you want to handle custom field types */
  mapCustomFieldToZodType?: MapFormFieldToZod;
  /** whether or not client side validation should be used, defaults to `false` */
  shouldValidate?: boolean;
  /** whether or not native browser validation should be used in combination with client side validation, defaults to `false` */
  shouldUseNativeValidation?: boolean;
}

export interface UmbracoFormContext {
  /** form definition */
  form: FormDto;
  /** configuration for form component */
  config: UmbracoFormConfig;
  /** number of times the form or a form page withing the form has been attempted to be submitted */
  progressionAttemptCount: number;
  /** current page number */
  currentPage: number;
  /** total number of pages */
  totalPages: number;
}
