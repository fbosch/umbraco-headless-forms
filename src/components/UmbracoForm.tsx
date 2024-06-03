import React, { Fragment, useState } from "react";
import type {
  DefaultFormFieldTypeName,
  FormDto,
  UmbracoFormConfig,
  FormProps,
  PageProps,
  ColumnProps,
  InputProps,
  FieldsetProps,
  FieldProps,
  SubmitButtonProps,
  FormContext,
} from "./types";
import { evaluateCondition, exhaustiveCheck } from "./utils";
import { coerceFormData, umbracoFormToZod } from "./umbraco-form-to-zod";
import { ZodIssue } from "zod-validation-error";

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
  renderSubmit?: (props: SubmitButtonProps) => React.ReactNode;
}

function DefaultForm({ form, ...rest }: FormProps): React.ReactNode {
  return <form {...rest} id={"form-" + form.id} name={form.id} />;
}

function DefaultPage({
  page,
  children,
  condition,
}: PageProps): React.ReactNode {
  if (condition.hide) return null;
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
  if (condition.hide) return null;
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
}: FieldProps): React.ReactNode {
  if (condition.hide) return null;
  return (
    <Fragment>
      <label htmlFor={field.id}>{field.caption}</label>
      {children}
      {field.helpText ? <span>{field.helpText}</span> : null}
    </Fragment>
  );
}

function DefaultInput({ field, context }: InputProps): React.ReactNode {
  const { disableDefaultValidation = false } = context.config ?? {};
  let common = {
    name: field.alias,
    id: field.id,
    placeholder: field.placeholder ? field.placeholder : undefined,
    title: field.caption ? field.caption : undefined,
    autoComplete: field?.settings?.autocompleteAttribute
      ? field.settings?.autocompleteAttribute
      : undefined,
    defaultValue: field?.settings?.defaultValue
      ? field.settings?.defaultValue
      : undefined,
    required: disableDefaultValidation ? undefined : field.required,
    pattern: disableDefaultValidation ? undefined : field.pattern,
  };

  const fieldName = field?.type?.name as DefaultFormFieldTypeName;

  switch (fieldName) {
    case "Short answer":
      return <input type={field?.settings?.fieldType || "text"} {...common} />;
    case "Long answer":
      return <textarea {...common} />;
    case "Checkbox":
      return <input type="checkbox" {...common} />;
    case "Multiple choice":
      return (
        <Fragment>
          {field?.preValues?.map((preValue) => {
            const id = common.id + "-" + preValue.value;
            return (
              <Fragment key={id}>
                <label htmlFor={id}>{preValue.caption}</label>
                <input
                  {...common}
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
          {...common}
          multiple={!!field?.settings?.allowMultipleSelections ?? false}
        >
          {field?.preValues?.map((preValue) => (
            <option
              key={common.id + "-" + preValue.value}
              value={preValue.value}
            >
              {preValue.caption}
            </option>
          ))}
        </select>
      );
    case "Data Consent":
      return <input type="checkbox" {...common} />;
    case "File upload":
      return (
        <input
          type="file"
          {...common}
          accept={field?.fileUploadOptions?.allowedUploadExtensions?.join(",")}
        />
      );
    case "Recaptcha2":
      return <input type="hidden" {...common} />;
    case "Recaptcha v3 with score":
      return <input type="hidden" {...common} />;
    default:
      return exhaustiveCheck(fieldName);
  }
}

function DefaultSubmitButton({ form }: SubmitButtonProps): React.ReactNode {
  return <button type="submit">{form.submitLabel}</button>;
}

function UmbracoForm(props: UmbracoFormProps) {
  const {
    form,
    renderForm: Form = DefaultForm,
    renderPage: Page = DefaultPage,
    renderFieldset: Fieldset = DefaultFieldset,
    renderColumn: Column = DefaultColumn,
    renderField: Field = DefaultField,
    renderInput: Input = DefaultInput,
    renderSubmit: SubmitButton = DefaultSubmitButton,
    children,
    onChange,
    onSubmit,
    config: configOverride = {},
    ...rest
  } = props;

  const config: UmbracoFormConfig = {
    schema: umbracoFormToZod(form, configOverride as UmbracoFormConfig),
    ...configOverride,
  };

  const [formData, setFormData] = useState<FormData | undefined>(undefined);
  const [valid, setValid] = useState<boolean>(false);
  const [issues, setIssues] = useState<ZodIssue[]>([]);
  const handleOnChange = (e: React.ChangeEvent<HTMLFormElement>) => {
    const formData = new FormData(e.currentTarget);
    setFormData(formData);
    const parsedForm = config.schema.safeParse(
      coerceFormData(formData, config.schema),
    );
    if (parsedForm.success) {
      setValid(true);
      setIssues([]);
    } else {
      setIssues(parsedForm.error.issues);
      setValid(false);
    }
    if (typeof onChange === "function") {
      onChange(e);
    }
  };

  const handleOnSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsedForm = config.schema.safeParse(
      coerceFormData(formData, config.schema),
    );
    if (parsedForm.success) {
      setValid(true);
      setIssues([]);
    } else {
      setIssues(parsedForm.error.issues);
      setValid(false);
    }
  };

  const context: FormContext = { form, formData, config };

  return (
    <Form
      form={form}
      {...rest}
      onChange={handleOnChange}
      onSubmit={handleOnSubmit}
    >
      {form?.pages?.map((page, index) => (
        <Page
          page={page}
          key={"page-" + index}
          context={context}
          condition={evaluateCondition(page, form, formData, config)}
        >
          {page?.fieldsets?.map((fieldset, index) => (
            <Fieldset
              fieldset={fieldset}
              key={"fieldset-" + index}
              context={context}
              condition={evaluateCondition(fieldset, form, formData, config)}
            >
              {fieldset?.columns?.map((column, index) => (
                <Column
                  column={column}
                  key={"column-" + index}
                  context={context}
                >
                  {column?.fields?.map((field) => (
                    <Field
                      field={field}
                      key={"field-" + field?.id}
                      context={context}
                      condition={evaluateCondition(
                        field,
                        form,
                        formData,
                        config,
                      )}
                      issues={issues?.filter(
                        // improve this
                        (issue) => issue.path.join(".") === field.alias,
                      )}
                    >
                      {
                        // fallback to default component if custom component returns undefined
                        Input({ field, context }) ??
                          DefaultInput({ field, context })
                      }
                    </Field>
                  ))}
                </Column>
              ))}
            </Fieldset>
          ))}
        </Page>
      ))}
      {children}
      <SubmitButton form={form} />
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
