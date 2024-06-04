import React, { Fragment, useCallback, useState } from "react";
import type {
  BaseSchema,
  UmbracoFormContext,
  UmbracoFormConfig,
  DefaultFormFieldTypeName,
  FormDto,
  FormProps,
  PageProps,
  ColumnProps,
  InputProps,
  FieldsetProps,
  FieldProps,
  ButtonProps,
  DtoWithCondition,
  FormPageDto,
} from "./types";
import {
  evaluateCondition,
  exhaustiveCheck,
  getAllFieldsOnPage,
  getAllFieldsFilteredByConditions,
} from "./utils";
import {
  coerceFormData,
  umbracoFormToZod,
  omitConditionalFields,
} from "./umbraco-form-to-zod";
import { ZodIssue } from "zod-validation-error";
import { shouldShowIndicator } from "./predicates";

export interface UmbracoFormProps
  extends React.FormHTMLAttributes<HTMLFormElement> {
  requestToken?: string;
  form: FormDto;
  config?: Partial<UmbracoFormConfig>;
  renderForm?: (props: FormProps) => React.ReactNode;
  renderPage?: (props: PageProps) => React.ReactNode;
  renderFieldset?: (props: FieldsetProps) => React.ReactNode;
  renderColumn?: (props: ColumnProps) => React.ReactNode;
  renderField?: (props: FieldProps) => React.ReactNode;
  renderInput?: (props: InputProps) => React.ReactNode | undefined;
  renderSubmit?: (props: ButtonProps) => React.ReactNode;
  renderNextButton?: (props: ButtonProps) => React.ReactNode;
  renderPreviousButton?: (props: ButtonProps) => React.ReactNode;
}

function DefaultForm({ form, ...rest }: FormProps): React.ReactNode {
  return <form {...rest} id={"form-" + form.id} name={form.id} />;
}

function DefaultPage({
  page,
  pageIndex,
  children,
  condition,
  context,
}: PageProps): React.ReactNode {
  if (!condition) return null;
  if (context.totalPages > 1 && context.currentPage !== pageIndex) {
    return null;
  }
  return (
    <Fragment>
      {page.caption ? <h2>{page.caption}</h2> : null}
      {children}
    </Fragment>
  );
}

function DefaultFieldset({
  fieldset,
  children,
  condition,
}: FieldsetProps): React.ReactNode {
  if (!condition) return null;
  return (
    <Fragment>
      {fieldset.caption ? <h3>{fieldset.caption}</h3> : null}
      {children}
    </Fragment>
  );
}

function DefaultColumn({ column, children }: ColumnProps): React.ReactNode {
  return (
    <Fragment>
      {column.caption ? <h4>{column.caption}</h4> : null}
      {children}
    </Fragment>
  );
}

function DefaultField({
  field,
  children,
  condition,
  issues,
  context,
}: FieldProps): React.ReactNode {
  if (!condition) return null;
  const hasIssues = issues && issues.length > 0;
  const showValidationErrors =
    hasIssues && context.form.hideFieldValidation !== true;
  const indicator = shouldShowIndicator(field, context.form)
    ? context.form.indicator
    : "";
  const helpTextId = field.helpText ? "helpText:" + field.id : undefined;
  const fieldTypeName = field.type?.name as DefaultFormFieldTypeName;
  const helpText = field.helpText ? (
    <span id={helpTextId}>{field.helpText}</span>
  ) : null;
  const validationErrors = showValidationErrors ? (
    <span id={"error:" + field.id}>{issues?.at(0)?.message}</span>
  ) : null;

  if (fieldTypeName === "Multiple choice") {
    return (
      <fieldset>
        <legend>
          {field.caption} {indicator}
        </legend>
        {helpText}
        {children}
        {validationErrors}
      </fieldset>
    );
  }

  return (
    <Fragment>
      <label htmlFor={field.id} aria-describedby={helpTextId}>
        {field.caption} {indicator}
      </label>
      {helpText}
      {children}
      {validationErrors}
    </Fragment>
  );
}

function DefaultInput({
  field,
  issues,
  context,
  ...rest
}: InputProps): React.ReactNode {
  const { shouldValidate: validate } = context.config;
  const hasIssues = issues && issues?.length > 0;

  let attributes = {
    name: field.alias,
    id: field.id,
    placeholder: field.placeholder || undefined,
    title: field.caption || undefined,
    autoComplete: field?.settings?.autocompleteAttribute || undefined,
    defaultValue: field?.settings?.defaultValue || undefined,
    required: validate && field.required ? field.required : undefined,
    pattern: validate && field.pattern ? field.pattern : undefined,
    ["aria-invalid"]: validate ? hasIssues : undefined,
    ["aria-errormessage"]:
      validate && hasIssues ? issues.at(0)?.message : undefined,
    ...rest,
  };

  const fieldName = field?.type?.name as DefaultFormFieldTypeName;

  switch (fieldName) {
    case "Short answer":
      return (
        <input type={field?.settings?.fieldType || "text"} {...attributes} />
      );
    case "Long answer":
      return <textarea {...attributes} />;
    case "Checkbox":
      return <input type="checkbox" {...attributes} />;
    case "Multiple choice":
      return (
        <Fragment>
          {field?.preValues?.map((preValue) => {
            const id = preValue.value + ":" + attributes.id;
            return (
              <Fragment key={id}>
                <label htmlFor={id}>{preValue.caption}</label>
                <input
                  {...attributes}
                  id={id}
                  type="radio"
                  value={preValue.value}
                />
              </Fragment>
            );
          })}
        </Fragment>
      );
    case "Dropdown":
      return (
        <select
          {...attributes}
          multiple={!!field?.settings?.allowMultipleSelections ?? false}
        >
          {field?.preValues?.map((preValue) => (
            <option
              key={`${attributes.id}.${preValue.value}`}
              value={preValue.value}
            >
              {preValue.caption}
            </option>
          ))}
        </select>
      );
    case "Data Consent":
      return <input type="checkbox" {...attributes} />;
    case "File upload":
      return (
        <input
          type="file"
          {...attributes}
          accept={field?.fileUploadOptions?.allowedUploadExtensions?.join(",")}
        />
      );
    case "Recaptcha2":
      return <input type="hidden" {...attributes} />;
    case "Recaptcha v3 with score":
      return <input type="hidden" {...attributes} />;
    default:
      return exhaustiveCheck(fieldName);
  }
}

function DefaultSubmitButton({
  context,
  ...rest
}: ButtonProps): React.ReactNode {
  if (
    context.totalPages > 1 &&
    context.currentPage !== context.totalPages - 1
  ) {
    return null;
  }
  return (
    <button type="submit" {...rest}>
      {context.form.submitLabel}
    </button>
  );
}

function DefaultNextButton({ context, ...rest }: ButtonProps): React.ReactNode {
  if (context.currentPage === context.totalPages - 1) {
    return null;
  }
  return (
    <button type="button" {...rest}>
      Next
    </button>
  );
}

function DefaultPreviousButton({
  context,
  ...rest
}: ButtonProps): React.ReactNode {
  if (context.currentPage === 0) {
    return null;
  }
  return (
    <button type="button" {...rest}>
      Previous
    </button>
  );
}

function UmbracoForm(props: UmbracoFormProps) {
  const {
    form,
    config: configOverride = {},
    renderForm: Form = DefaultForm,
    renderPage: Page = DefaultPage,
    renderFieldset: Fieldset = DefaultFieldset,
    renderColumn: Column = DefaultColumn,
    renderField: Field = DefaultField,
    renderInput: Input = DefaultInput,
    renderSubmit: SubmitButton = DefaultSubmitButton,
    renderNextButton: NextButton = DefaultNextButton,
    renderPreviousButton: PreviousButton = DefaultPreviousButton,
    children,
    onChange,
    onSubmit,
    ...rest
  } = props;

  const config: UmbracoFormConfig = {
    schema: umbracoFormToZod(form, configOverride as UmbracoFormConfig),
    shouldValidate: false,
    ...configOverride,
  };
  config.schema = configOverride?.schema ?? umbracoFormToZod(form, config);

  const [submitAttempts, setSubmitAttempts] = useState<number>(0);
  const [formData, setFormData] = useState<FormData | undefined>(undefined);
  const [data, setData] = useState<BaseSchema>({});
  const [formIssues, setFormIssues] = useState<ZodIssue[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

  const checkCondition = (dto: DtoWithCondition) =>
    evaluateCondition(dto, form, data, config);

  const totalPages =
    form?.pages?.filter((page) => checkCondition(page)).length ?? 1;

  const validateFormData = useCallback(
    (coercedData: BaseSchema) => {
      const dataWithConditionalFieldsOmitted = omitConditionalFields(
        form,
        coercedData,
        config,
      );
      console.log(dataWithConditionalFieldsOmitted);
      const parsedForm = config?.schema?.safeParse(coercedData);
      if (parsedForm?.success) {
        setFormIssues([]);
      } else if (parsedForm?.error?.issues) {
        setFormIssues(parsedForm.error.issues);
      }
      return parsedForm;
    },
    [form],
  );

  const handleOnChange = (e: React.ChangeEvent<HTMLFormElement>) => {
    const formData = new FormData(e.currentTarget);
    const coercedData = coerceFormData(formData, config);
    setFormData(formData);
    setData(coercedData);
    if (
      config.shouldValidate &&
      submitAttempts > 0 &&
      validateFormData(coercedData).success === false
    ) {
      return;
    }
    if (typeof onChange === "function") {
      onChange(e);
    }
  };

  const activePageDefinition = form?.pages?.[currentPage] as FormPageDto;

  const isCurrentPageValid = useCallback(() => {
    if (config.shouldValidate === false) {
      return true;
    }
    const fieldAliasesWithIssues = validateFormData(
      data,
    ).error?.issues?.flatMap((issue) => issue.path.join("."));

    const fieldsWithConditionsMet = getAllFieldsFilteredByConditions(
      form,
      data,
      config,
    ).map((field) => field.alias);

    // get all fields on the current page and filter out fields with conditions that are not met
    // so that they wont block the user from going to the next page
    const fieldsOnPage = getAllFieldsOnPage(activePageDefinition)
      .map((field) => field.alias)
      .filter((field) => fieldsWithConditionsMet.includes(field));

    if (
      fieldsOnPage.some(
        (field) => field && fieldAliasesWithIssues?.includes(field),
      )
    ) {
      // prevent user from going to next page if there are fields with issues on the current page

      return false;
    }
    return true;
  }, [form, data, config, currentPage]);

  const focusFirstInvalidField = () => {
    const fieldWithIssues = validateFormData(data).error?.issues?.find(
      (issue) => issue.path.length > 0,
    );
    if (fieldWithIssues) {
      const fieldId = fieldWithIssues.path.join(".");
      if (fieldId) {
        const fieldElement = document.querySelector(
          'form[] [name="' + fieldId + '"]',
        ) as HTMLInputElement;
        if (fieldElement) {
          fieldElement.focus();
        }
      }
    }
  };

  const handleNextPage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isCurrentPageValid() === false) {
      focusFirstInvalidField();
      return;
    }
    setCurrentPage((prev) => prev + 1);
  };

  const handlePreviousPage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (currentPage === 0) {
      return;
    }
    setCurrentPage((prev) => prev - 1);
  };

  const handleOnSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitAttempts((prev) => prev + 1);
    if (config.shouldValidate && validateFormData(data).success === false) {
      focusFirstInvalidField();
      return;
    }
    if (typeof onSubmit === "function") {
      onSubmit(e);
    }
  };

  const context: UmbracoFormContext = {
    form,
    formData,
    config,
    submitAttempts,
    totalPages,
    currentPage,
  };

  return (
    <Form
      form={form}
      {...rest}
      onChange={handleOnChange}
      onSubmit={handleOnSubmit}
    >
      {form?.pages?.map((page, index) => (
        <Page
          key={"page." + index}
          page={page}
          pageIndex={index}
          context={context}
          condition={checkCondition(page)}
        >
          {page?.fieldsets?.map((fieldset, index) => (
            <Fieldset
              key={"fieldset." + index}
              fieldset={fieldset}
              context={context}
              condition={checkCondition(fieldset)}
            >
              {fieldset?.columns?.map((column, index) => (
                <Column
                  key={"column." + index}
                  column={column}
                  context={context}
                >
                  {column?.fields?.map((field) => {
                    const issues = formIssues?.filter(
                      // improve this
                      (issue) => issue.path.join(".") === field.alias,
                    );
                    return (
                      <Field
                        key={"field." + field?.id}
                        field={field}
                        context={context}
                        condition={checkCondition(field)}
                        issues={issues}
                      >
                        {
                          // fallback to default component if custom component returns undefined
                          Input({ field, issues, context }) ??
                            DefaultInput({
                              field,
                              issues,
                              context,
                            })
                        }
                      </Field>
                    );
                  })}
                </Column>
              ))}
            </Fieldset>
          ))}
        </Page>
      ))}
      {children}
      {totalPages > 1 ? (
        <Fragment>
          <PreviousButton context={context} onClick={handlePreviousPage} />
          <NextButton context={context} onClick={handleNextPage} />
        </Fragment>
      ) : null}
      <SubmitButton context={context} />
    </Form>
  );
}

UmbracoForm.Input = DefaultInput;
UmbracoForm.Page = DefaultPage;
UmbracoForm.Fieldset = DefaultFieldset;
UmbracoForm.Column = DefaultColumn;
UmbracoForm.Field = DefaultField;
UmbracoForm.SubmitButton = DefaultSubmitButton;

export default UmbracoForm;
