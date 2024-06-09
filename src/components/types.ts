import {
  type MapFormFieldToZodFn,
  umbracoFormToZod,
} from "./umbraco-form-to-zod";
import type { components } from "./umbraco-form.d.ts";

/** Enum of default form field type ids
 * @see https://docs.umbraco.com/umbraco-forms/editor/creating-a-form/field-types */
export enum FieldTypeEnum {
  Checkbox = "d5c0c390-ae9a-11de-a69e-666455d89593",
  DataConsent = "a72c9df9-3847-47cf-afb8-b86773fd12cd",
  Date = "f8b4c3b8-af28-11de-9dd8-ef5956d89593",
  DropdownList = "0dd29d42-a6a5-11de-a2f2-222256d89593",
  FileUpload = "84a17cf8-b711-46a6-9840-0e4a072ad000",
  LongAnswer = "023f09ac-1445-4bcb-b8fa-ab49f33bd046",
  HiddenField = "da206cae-1c52-434e-b21a-4a7c198af877",
  MultipleChoice = "fab43f20-a6bf-11de-a28f-9b5755d89593",
  Password = "fb37bc60-d41e-11de-aeae-37c155d89593",
  Recaptcha2 = "b69deaeb-ed75-4dc9-bfb8-d036bf9d3730",
  RecaptchaV3WithScore = "663aa19b-423d-4f38-a1d6-c840c926ef86",
  RichText = "1f8d45f8-76e6-4550-a0f5-9637b8454619",
  SingleChoice = "903df9b0-a78c-11de-9fc1-db7a56d89593",
  ShortAnswer = "3f92e01b-29e2-4a30-bf33-9df5580ed52c",
  TitleAndDescription = "e3fbf6c4-f46c-495e-aff8-4b3c227b4a98",
}

export interface FieldTypeNameMap {
  [FieldTypeEnum.Checkbox]: "Checkbox";
  [FieldTypeEnum.DataConsent]: "Data consent";
  [FieldTypeEnum.Date]: "Date";
  [FieldTypeEnum.DropdownList]: "Dropdown";
  [FieldTypeEnum.FileUpload]: "File upload";
  [FieldTypeEnum.LongAnswer]: "Long answer";
  [FieldTypeEnum.HiddenField]: "Hidden field";
  [FieldTypeEnum.ShortAnswer]: "Short answer";
  [FieldTypeEnum.MultipleChoice]: "Multiple choice";
  [FieldTypeEnum.Recaptcha2]: "Recaptcha2";
  [FieldTypeEnum.RecaptchaV3WithScore]: "Recaptcha v3 with score";
  [FieldTypeEnum.Password]: "Password";
  [FieldTypeEnum.RichText]: "Rich text";
  [FieldTypeEnum.SingleChoice]: "Single choice";
  [FieldTypeEnum.TitleAndDescription]: "Title and description";
}

/** Field type settings
 * @see https://docs.umbraco.com/umbraco-forms/developer/configuration/type-details#field-types */
export interface FieldSettings {
  [FieldTypeEnum.ShortAnswer]: {
    defaultValue: string;
    placeholder: string;
    showLabel: string;
    maximumLength: string;
    fieldType: string;
    autocompleteAttribute: string;
  };
  [FieldTypeEnum.LongAnswer]: {
    defaultValue: string;
    placeholder: string;
    showLabel: string;
    autocompleteAttribute: string;
    numberOfRows: string;
    maximumLength: string;
  };
  [FieldTypeEnum.HiddenField]: {
    defaultValue: string;
  };
  [FieldTypeEnum.Checkbox]: {
    caption: string;
    defaultValue: string;
    showLabel: string;
  };
  [FieldTypeEnum.DropdownList]: {
    defaultValue: string;
    allowMultipleSelections: string;
    showLabel: string;
    autocompleteAttribute: string;
    selectPrompt: string;
  };
  [FieldTypeEnum.MultipleChoice]: {
    defaultValue: string;
    showLabel: string;
    preValues: Array<any>;
  };
  [FieldTypeEnum.DataConsent]: {
    acceptCopy: string;
    showLabel: string;
  };
  [FieldTypeEnum.FileUpload]: {
    selectFilesListHeading: string;
  };
  [FieldTypeEnum.Recaptcha2]: {
    theme: string;
    size: string;
    errorMessage: string;
  };
  [FieldTypeEnum.RecaptchaV3WithScore]: {
    scoreThreshold: string;
    errorMessage: string;
    saveScore: string;
  };
  [FieldTypeEnum.Date]: {
    placeholder: string;
  };
  [FieldTypeEnum.Password]: {
    placeholder: string;
  };
  [FieldTypeEnum.RichText]: {
    showLabel: string;
    html: string;
  };
  [FieldTypeEnum.SingleChoice]: {
    defaultValue: string;
    showLabel: string;
  };
  [FieldTypeEnum.TitleAndDescription]: {
    captionTag: string;
    caption: string;
    bodyText: string;
    showLabel: string;
  };
}

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
  name: FieldTypeNameMap[FieldTypeEnum];
  id: FieldTypeEnum;
}

/** Form field
 * @see https://docs.umbraco.com/umbraco-forms/developer/configuration/type-details#field-types */
export interface FormFieldDto
  extends Omit<components["schemas"]["FormFieldDto"], "type" | "settings"> {
  type: FormFieldTypeDto;
  settings: FieldSettings[FieldTypeEnum];
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

/** Configuration for the UmbracoForm component instance */
export interface UmbracoFormConfig {
  /** Custom schema for form validation; defaults to the umbracoFormToZod implementation */
  schema: ReturnType<typeof umbracoFormToZod>;
  /** Optional custom function to map form fields to Zod types, useful for handling custom field types */
  mapCustomFieldToZodType?: MapFormFieldToZodFn;
  /** Flag indicating if client-side validation should be performed; defaults to `false` */
  shouldValidate?: boolean;
  /** Flag indicating if native browser validation should be used alongside client-side validation; defaults to `false` */
  shouldUseNativeValidation?: boolean;
}

export interface UmbracoFormContext {
  /** The definition of the form */
  form: FormDto;
  /** The configuration for the form component */
  config: UmbracoFormConfig;
  /** The current page number of the form */
  currentPage: number;
  /** The total number of pages in the form */
  totalPages: number;
}
