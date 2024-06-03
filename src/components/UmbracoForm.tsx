import React, { Fragment, useState } from "react";
import type {
  DefaultFormFieldTypeName,
  FormDto,
  FormPageDto,
  FormFieldsetDto,
  FormFieldsetColumnDto,
  FormFieldDto,
  AppliedCondition,
  UmbracoFormConfig,
} from "./types";
import { applyCondition } from "./utils";

type ConditionalRenderProps = {
  condition: AppliedCondition;
};

type RenderProps = {
  children: React.ReactNode;
  form: FormDto;
} & (
  | ({ page: FormPageDto } & ConditionalRenderProps)
  | ({ fieldset: FormFieldsetDto } & ConditionalRenderProps)
  | { column: FormFieldsetColumnDto }
  | ({ field: FormFieldDto } & ConditionalRenderProps)
);

type FormProps = {
  form: FormDto;
} & React.FormHTMLAttributes<HTMLFormElement>;
type RenderSubmitButtonProps = { form: FormDto };
type PageProps = RenderProps & {
  page: FormPageDto;
  condition: AppliedCondition;
};
type FieldsetProps = RenderProps & {
  fieldset: FormFieldsetDto;
  condition: AppliedCondition;
};
type ColumnProps = RenderProps & {
  column: FormFieldsetColumnDto;
};
type FieldProps = RenderProps & {
  field: FormFieldDto;
  condition: AppliedCondition;
};
type InputProps = Omit<FieldProps, "children" | "condition">;

export interface UmbracoFormProps
  extends React.FormHTMLAttributes<HTMLFormElement> {
  requestToken?: string;
  form: FormDto;
  config?: UmbracoFormConfig;
  renderForm?: (props: FormProps) => React.ReactNode;
  renderPage?: (props: PageProps) => React.ReactNode;
  renderFieldset?: (props: FieldsetProps) => React.ReactNode;
  renderColumn?: (props: ColumnProps) => React.ReactNode;
  renderField?: (props: FieldProps) => React.ReactNode;
  renderInput?: (props: InputProps) => React.ReactNode | undefined;
  renderSubmit?: (props: RenderSubmitButtonProps) => React.ReactNode;
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

function DefaultInput({ field }: InputProps): React.ReactNode {
  const common = {
    name: field.alias,
    id: field.id,
    required: field.required,
    placeholder: field.placeholder ? field.placeholder : undefined,
    title: field.caption ? field.caption : undefined,
    autoComplete: field?.settings?.autocompleteAttribute
      ? field.settings?.autocompleteAttribute
      : undefined,
    pattern: field.pattern ? field.pattern : undefined,
    defaultValue: field?.settings?.defaultValue
      ? field.settings?.defaultValue
      : undefined,
  };

  const fieldName = field?.type?.name as DefaultFormFieldTypeName;

  function exhaustiveCheck(value: never): never {
    throw new Error("Exhaustive check failed for field type: " + value);
  }

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

function DefaultSubmitButton({
  form,
}: RenderSubmitButtonProps): React.ReactNode {
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
    ...rest
  } = props;

  const [formData, setFormData] = useState<FormData | undefined>(undefined);

  return (
    <Form
      form={form}
      {...rest}
      onChange={(e) => {
        setFormData(new FormData(e.currentTarget));
        if (typeof onChange === "function") {
          onChange(e);
        }
      }}
    >
      {form?.pages?.map((page, index) => (
        <Page
          page={page}
          key={"page-" + index}
          form={form}
          condition={applyCondition(page, form, formData)}
        >
          {page?.fieldsets?.map((fieldset, index) => (
            <Fieldset
              fieldset={fieldset}
              key={"fieldset-" + index}
              form={form}
              condition={applyCondition(fieldset, form, formData)}
            >
              {fieldset?.columns?.map((column, index) => (
                <Column column={column} key={"column-" + index} form={form}>
                  {column?.fields?.map((field) => (
                    <Field
                      field={field}
                      key={"field-" + field?.id}
                      form={form}
                      condition={applyCondition(field, form, formData)}
                    >
                      {
                        // fallback to default component if custom component returns undefined
                        Input({ field, form }) ?? DefaultInput({ field, form })
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
