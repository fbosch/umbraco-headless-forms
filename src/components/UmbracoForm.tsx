import React, { Fragment, useId } from "react";
import type {
  UmbracoFormDefinition,
  FormPageDto,
  FormFieldsetDto,
  FormFieldsetColumnDto,
  FormFieldDto,
} from "./umbraco-form.types";

interface CommonRenderProps {
  children: React.ReactNode;
}
type RenderProps = CommonRenderProps &
  (
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

type RenderPageProps = RenderProps & { page: FormPageDto };

type RenderFieldsetProps = RenderProps & { fieldset: FormFieldsetDto };

type RenderColumnProps = RenderProps & { column: FormFieldsetColumnDto };

type RenderFieldProps = RenderProps & { field: FormFieldDto };

type RenderInputProps = Omit<CommonRenderProps, "children"> & {
  field: FormFieldDto;
};

type RenderSubmitButtonProps = {
  form: UmbracoFormDefinition;
};

export interface UmbracoFormProps
  extends React.FormHTMLAttributes<HTMLFormElement> {
  form: UmbracoFormDefinition;
  requestToken?: string;
  renderPage?: (props: RenderPageProps) => React.ReactNode;
  renderFieldset?: (props: RenderFieldsetProps) => React.ReactNode;
  renderColumn?: (props: RenderColumnProps) => React.ReactNode;
  renderField?: (props: RenderFieldProps) => React.ReactNode;
  renderInput?: (props: RenderInputProps) => React.ReactNode | undefined;
  renderSubmitButton?: (props: RenderSubmitButtonProps) => React.ReactNode;
}

export function Page({ page, children }: RenderPageProps): React.ReactNode {
  return (
    <Fragment>
      {page.caption ? <h2>{page.caption}</h2> : null}
      {children}
    </Fragment>
  );
}

export function FieldSet({
  fieldset,
  children,
}: RenderFieldsetProps): React.ReactNode {
  return (
    <Fragment>
      {fieldset.caption ? <h3>{fieldset.caption}</h3> : null}
      {children}
    </Fragment>
  );
}

export function Column({
  column,
  children,
}: RenderColumnProps): React.ReactNode {
  return (
    <Fragment>
      {column.caption ? <h4>{column.caption}</h4> : null}
      {children}
    </Fragment>
  );
}

export function Field({ field, children }: RenderFieldProps): React.ReactNode {
  return (
    <Fragment>
      <label htmlFor={field.alias}>{field.caption}</label>
      {children}
      {field.helpText ? <span>{field.helpText}</span> : null}
    </Fragment>
  );
}

export function Input({ field }: RenderInputProps): React.ReactNode {
  return mapFieldTypeNameToInputNode({ field });
}

function mapFieldTypeNameToInputNode({
  field,
}: RenderInputProps): React.ReactNode {
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

function defaultRenderSubmitButton({
  form,
}: RenderSubmitButtonProps): React.ReactNode {
  return <button type="submit">{form.submitLabel}</button>;
}

const defaultRenderPage = (props: RenderPageProps) => <Page {...props} />;
const defaultRenderFieldset = (props: RenderFieldsetProps) => (
  <FieldSet {...props} />
);
const defaultRenderColumn = (props: RenderColumnProps) => <Column {...props} />;
const defaultRenderField = (props: RenderFieldProps) => <Field {...props} />;
const defaultRenderInput = (props: RenderInputProps) => <Input {...props} />;

function UmbracoForm(props: UmbracoFormProps) {
  const id = useId();
  const {
    form,
    onSubmit,
    renderPage = defaultRenderPage,
    renderFieldset = defaultRenderFieldset,
    renderColumn = defaultRenderColumn,
    renderField = defaultRenderField,
    renderInput = defaultRenderInput,
    renderSubmitButton = defaultRenderSubmitButton,
    children,
    ...rest
  } = props;

  return (
    <form {...rest} id={"form-" + form.id} name={form.id} onSubmit={onSubmit}>
      {form.pages.map((page, index) => (
        <Fragment key={id + "-page-" + index}>
          {renderPage({
            page,
            children: page.fieldsets.map((fieldset, index) => (
              <Fragment key={id + "-fieldset-" + index}>
                {renderFieldset({
                  fieldset,
                  children: fieldset.columns.map((column, index) => (
                    <Fragment key={id + "-column-" + index}>
                      {renderColumn({
                        column,
                        children: column.fields.map((field, index) => (
                          <Fragment key={id + "-field-" + index}>
                            {renderField({
                              field,
                              children:
                                renderInput({ field }) ??
                                defaultRenderInput({ field }),
                            })}
                          </Fragment>
                        )),
                      })}
                    </Fragment>
                  )),
                })}
              </Fragment>
            )),
          })}
        </Fragment>
      ))}
      {children}
      {renderSubmitButton({ form })}
    </form>
  );
}

export default UmbracoForm;
