import { Fragment } from "react";
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

interface RenderPageProps extends CommonRenderProps {
  page: FormPageDto;
}

interface RenderFieldsetProps extends CommonRenderProps {
  fieldset: FormFieldsetDto;
}

interface RenderColumnProps extends CommonRenderProps {
  column: FormFieldsetColumnDto;
}

interface RenderFieldProps extends CommonRenderProps {
  field: FormFieldDto;
}

interface RenderInputProps extends Omit<CommonRenderProps, "children"> {
  field: FormFieldDto;
}

interface RenderSubmitButtonProps {
  form: UmbracoFormDefinition;
}

export interface UmbracoFormProps
  extends React.FormHTMLAttributes<HTMLFormElement> {
  form: UmbracoFormDefinition;
  requestToken?: string;
  renderPage?: (props: RenderPageProps) => React.ReactNode;
  renderFieldset?: (props: RenderFieldsetProps) => React.ReactNode;
  renderColumn?: (props: RenderColumnProps) => React.ReactNode;
  renderField?: (props: RenderFieldProps) => React.ReactNode;
  renderInput?: (props: RenderInputProps) => React.ReactNode;
  renderSubmitButton?: (props: RenderSubmitButtonProps) => React.ReactNode;
}

function defaultRenderPage({
  page,
  children,
}: RenderPageProps): React.ReactNode {
  return (
    <Fragment>
      <h2>{page.caption}</h2>
      {children}
    </Fragment>
  );
}

function defaultRenderFieldset({
  fieldset,
  children,
}: RenderFieldsetProps): React.ReactNode {
  return (
    <Fragment>
      <h3>{fieldset.caption}</h3>
      {children}
    </Fragment>
  );
}

function defaultRenderColumn({
  column,
  children,
}: RenderColumnProps): React.ReactNode {
  return (
    <Fragment>
      <h4>{column.caption}</h4>
      {children}
    </Fragment>
  );
}

function defaultRenderField({
  field,
  children,
}: RenderFieldProps): React.ReactNode {
  return (
    <Fragment>
      <label htmlFor={field.alias}>{field.caption}</label>
      {children}
    </Fragment>
  );
}

function exhaustiveCheck(value: string): never {
  throw new Error("Exhaustive check failed for value: " + value);
}

function defaultRenderInput({ field }: RenderInputProps): React.ReactNode {
  const common = {
    name: field.alias,
    id: field.alias,
    required: field.required,
    placeholder: field.placeholder,
    autoComplete: field.settings?.autocompleteAttribute,
  };

  switch (field.type.name.toLowerCase()) {
    case "short answer":
      return <input type="text" {...common} />;
    case "long answer":
      return <textarea {...common} />;
    case "email":
      return <input type="email" {...common} />;
    case "checkbox":
      return <input type="checkbox" {...common} />;
    case "multiple choice":
    case "dropdown":
      return (
        <select {...common} multiple={field.settings?.allowMultipleSelections}>
          {field.preValues.map((preValue, index) => (
            <option key={"preValue-" + index} value={preValue.value}>
              {preValue.caption}
            </option>
          ))}
        </select>
      );
    case "data consent":
      return <input type="checkbox" {...common} />;
    case "file upload":
      return (
        <input
          type="file"
          {...common}
          accept={field.fileUploadOptions?.allowedUploadExtensions.join(",")}
        />
      );
    case "recaptcha2":
      return <input type="hidden" {...common} />;
    case "recaptcha v3 with score":
      return <input type="hidden" {...common} />;
    default:
      return exhaustiveCheck(field.type.name);
  }
}

function defaultRenderSubmitButton({
  form,
}: RenderSubmitButtonProps): React.ReactNode {
  return (
    <button type="submit" form={form.id}>
      {form.submitLabel}
    </button>
  );
}

function UmbracoForm(props: UmbracoFormProps) {
  const {
    form,
    onSubmit,
    renderPage = defaultRenderPage,
    renderFieldset = defaultRenderFieldset,
    renderColumn = defaultRenderColumn,
    renderField = defaultRenderField,
    renderInput = defaultRenderInput,
    renderSubmitButton = defaultRenderSubmitButton,
    ...rest
  } = props;

  return (
    <form {...rest} id={"form-" + form.id} name={form.id}>
      {form.pages.map((page, index) => (
        <Fragment key={"page-" + index}>
          {renderPage({
            page,
            children: page.fieldsets.map((fieldset, index) => (
              <Fragment key={"fieldset-" + index}>
                {renderFieldset({
                  fieldset,
                  children: fieldset.columns.map((column, index) => (
                    <Fragment key={"column-" + index}>
                      {renderColumn({
                        column,
                        children: column.fields.map((field, index) => (
                          <Fragment key={"field-" + index}>
                            {renderField({
                              field,
                              children: renderInput({
                                field,
                              }),
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
      {renderSubmitButton({ form })}
    </form>
  );
}

export default UmbracoForm;
