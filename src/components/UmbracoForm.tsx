import React, { Fragment, useId } from "react";
import type {
  UmbracoFormDefinition,
  FormPageDto,
  FormFieldsetDto,
  FormFieldsetColumnDto,
  FormFieldDto,
} from "./umbraco-form.types";

type RenderProps = {
  children: React.ReactNode;
  form: UmbracoFormDefinition;
} & (
  | {
      page: FormPageDto;
    }
  | {
      fieldset: FormFieldsetDto;
    }
  | {
      column: FormFieldsetColumnDto;
    }
  | {
      field: FormFieldDto;
    }
);

type FormProps = {
  form: UmbracoFormDefinition;
} & React.FormHTMLAttributes<HTMLFormElement>;
type RenderSubmitButtonProps = { form: UmbracoFormDefinition };
type PageProps = RenderProps & { page: FormPageDto };
type FieldsetProps = RenderProps & { fieldset: FormFieldsetDto };
type ColumnProps = RenderProps & { column: FormFieldsetColumnDto };
type FieldProps = RenderProps & { field: FormFieldDto };
type InputProps = Omit<FieldProps, "children">;

export interface UmbracoFormProps
  extends React.FormHTMLAttributes<HTMLFormElement> {
  requestToken?: string;
  form: UmbracoFormDefinition;
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

function DefaultPage({ page, children }: PageProps): React.ReactNode {
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
}: FieldsetProps): React.ReactNode {
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

function DefaultField({ field, children }: FieldProps): React.ReactNode {
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
  };

  function exhaustiveCheck(value: never): never {
    throw new Error("Exhaustive check failed for value: " + value);
  }

  switch (field.type.name) {
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
        <select {...common} multiple={field.settings?.allowMultipleSelections}>
          {field.preValues.map((preValue) => (
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
          accept={field.fileUploadOptions?.allowedUploadExtensions.join(",")}
        />
      );
    case "Recaptcha2":
      return <input type="hidden" {...common} />;
    case "Recaptcha v3 with score":
      return <input type="hidden" {...common} />;
    default:
      return exhaustiveCheck(field.type.name);
  }
}

function DefaultSubmitButton({
  form,
}: RenderSubmitButtonProps): React.ReactNode {
  return <button type="submit">{form.submitLabel}</button>;
}

function UmbracoForm(props: UmbracoFormProps) {
  const id = useId();
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
    ...rest
  } = props;

  return (
    <Form form={form} {...rest}>
      {form.pages.map((page, index) => (
        <Page page={page} key={id + "-page-" + index} form={form}>
          {page.fieldsets.map((fieldset, index) => (
            <Fieldset
              fieldset={fieldset}
              key={id + "-fieldset-" + index}
              form={form}
            >
              {fieldset.columns.map((column, index) => (
                <Column
                  column={column}
                  key={id + "-column-" + index}
                  form={form}
                >
                  {column.fields.map((field, index) => (
                    <Field
                      field={field}
                      key={id + "-field-" + index}
                      form={form}
                    >
                      {Input({ field, form }) ?? DefaultInput({ field, form })}
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
