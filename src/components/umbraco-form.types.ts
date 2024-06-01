export type FieldIndicationType =
  | "NoIndicator"
  | "MarkMandatoryFields"
  | "MarkOptionalFields";

interface IApiContentStartItemModel {
  id: string;
  path: string;
}

interface IApiContentRouteModel {
  path: string;
  startItem: IApiContentStartItemModel;
}

type FieldConditionActionType = "Show" | "Hide";
type FieldConditionLogicType = "All" | "Any";
type FieldConditionRuleOperator =
  | "Is"
  | "IsNot"
  | "GreaterThan"
  | "LessThan"
  | "Contains"
  | "StartsWith"
  | "EndsWith";

interface FieldConditionRuleDto {
  field: string;
  operator: FieldConditionRuleOperator;
  value: string;
}

interface FormConditionDto {
  actionType: FieldConditionActionType;
  logicType: FieldConditionLogicType;
  rules: FieldConditionRuleDto[];
}

interface FormFileUploadOptionsDto {
  allowAllUploadExtensions: boolean;
  allowedUploadExtensions: string[];
  allowMultipleFileUploads: boolean;
}

interface FormFieldPrevalueDto {
  value: string;
  caption: string;
}

type FormFieldTypeName =
  | "Short answer"
  | "Long answer"
  | "Email"
  | "Checkbox"
  | "Dropdown"
  | "Multiple choice"
  | "Data consent"
  | "File upload"
  | "Recaptcha2"
  | "Recaptcha v3 with score";

interface FormFieldTypeDto {
  id: string;
  name: FormFieldTypeName;
  supportsPreValues?: boolean;
  renderInputType?: string;
}

type FormFieldSettings = {
  defaultValue: string;
  placeholder: string | undefined;
  showLabel: string;
  maximumLength: string;
  fieldType: string;
  autocompleteAttribute: string;
  allowMultipleSelections?: boolean;
};

export interface FormFieldDto {
  id: string;
  caption: string;
  helpText: string | null | undefined;
  placeholder: string | undefined;
  cssClass?: string | null | undefined;
  alias: string | undefined;
  required: boolean;
  requiredErrorMessage: string | null | undefined;
  pattern: string | undefined;
  patternInvalidErrorMessage: string | null | undefined;
  condition?: FormConditionDto;
  fileUploadOptions?: FormFileUploadOptionsDto;
  preValues: FormFieldPrevalueDto[];
  settings?: FormFieldSettings;
  type: FormFieldTypeDto;
}

export interface FormFieldsetColumnDto {
  caption: string;
  width?: number;
  fields: FormFieldDto[];
}

export interface FormFieldsetDto {
  id: string;
  caption: string;
  condition?: FormConditionDto;
  columns: FormFieldsetColumnDto[];
}

export interface FormPageDto {
  caption: string;
  condition?: FormConditionDto;
  fieldsets: FormFieldsetDto[];
}

export interface UmbracoFormDefinition {
  id: string;
  name: string;
  indicator: string;
  cssClass?: string | null;
  nextLabel: string | null | undefined;
  previousLabel: string | null | undefined;
  submitLabel: string | null | undefined;
  disableDefaultStylesheet: boolean;
  fieldIndicationType: FieldIndicationType;
  hideFieldValidation: boolean;
  messageOnSubmit: string | null | undefined;
  messageOnSubmitIsHtml?: boolean;
  showValidationSummary: boolean;
  gotoPageOnSubmit?: string | null | undefined;
  gotoPageOnSubmitRoute?: IApiContentRouteModel | null;
  pages: FormPageDto[];
}
