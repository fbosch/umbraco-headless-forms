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

function defaultRenderPage({
  page,
  children,
}: RenderPageProps): React.ReactNode {
  return (
    <Fragment>
      {page.caption ? <h2>{page.caption}</h2> : null}
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
      {fieldset.caption ? <h3>{fieldset.caption}</h3> : null}
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
      {column.caption ? <h4>{column.caption}</h4> : null}
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

function mapFieldTypeNameToInputNode({
  field,
}: RenderInputProps): React.ReactNode {
  const common = {
    name: field.alias,
    id: field.alias,
    required: field.required,
    placeholder: field.placeholder,
    autoComplete: field.settings?.autocompleteAttribute,
  };

  function exhaustiveCheck(value: never): never {
    throw new Error("Exhaustive check failed for value: " + value);
  }

  switch (field.type.name) {
    case "Short answer":
      return <input type="text" {...common} />;
    case "Long answer":
      return <textarea {...common} />;
    case "Email":
      return <input type="email" {...common} />;
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

function defaultRenderInput({ field }: RenderInputProps): React.ReactNode {
  return mapFieldTypeNameToInputNode({ field });
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

function isDefaultKey(key: React.Key): boolean {
  return /^\.\d+$/.test(String(key));
}

function recursiveGetChildKeys(element: React.ReactElement): string[] {
  const keys: string[] = [];

  if (element.props.children) {
    const children = React.Children.toArray(element.props.children);
    children.forEach((child) => {
      if (React.isValidElement(child) && child.key) {
        if (child.key && !isDefaultKey(child.key)) {
          keys.push(String(child.key));
        }
        keys.push(...recursiveGetChildKeys(child));
      }
    });
  }

  return keys.filter(Boolean).map((key) => key.split("$")[1]);
}

function renderAndAssertChildren<T extends RenderProps>(
  renderFn: (props: T) => React.ReactNode,
) {
  return (props: Omit<T, "children">) => (children: React.ReactNode) => {
    const output = renderFn({ ...props, children } as T) as React.ReactElement;
    const childKeys = recursiveGetChildKeys({
      props: { children },
    } as React.ReactElement);
    // get all the keys from the render output
    const keys = recursiveGetChildKeys(output);
    // check that all the keys from the children are present in the output
    if (!childKeys.every((key) => keys.includes(key))) {
      // if not, throw an error
      throw new Error(
        `(${renderFn.name}) required children from props are not present in the render output`,
      );
    }
    return output;
  };
}

/**
 * Creates a render function with optional custom rendering capability. If customRenderer matches defaultRenderer,
 * it returns a function passing children through defaultRenderer. Otherwise, it validates children presence in the output of the customRenderer.
 *
 * @param {Function} defaultRenderer - Default rendering function
 * @param {Function} customerRenderer - Custom rendering function
 * @returns {Function} renderFunction
 */
function createRenderFunction<T extends RenderProps>(
  defaultRenderer: (props: T) => React.ReactNode,
  customRenderer: (props: T) => React.ReactNode,
): (
  props: Omit<T, "children">,
) => (children: React.ReactNode) => React.ReactNode {
  if (customRenderer === defaultRenderer) {
    return (props: Omit<T, "children">) => (children: React.ReactNode) =>
      defaultRenderer({ ...props, children } as T);
  }
  // assert that the children of the props are present in the rendered output if custom rendering is used
  return renderAndAssertChildren<T>(customRenderer);
}

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

  const _renderPage = createRenderFunction(defaultRenderPage, renderPage);

  const _renderFieldset = createRenderFunction(
    defaultRenderFieldset,
    renderFieldset,
  );
  const _renderColumn = createRenderFunction(defaultRenderColumn, renderColumn);

  const _renderField = createRenderFunction(defaultRenderField, renderField);

  return (
    <form {...rest} id={"form-" + form.id} name={form.id}>
      {form.pages.map((page, index) => (
        <Fragment key={id + "-page-" + index}>
          {_renderPage({ page })(
            page.fieldsets.map((fieldset, index) => (
              <Fragment key={id + "-fieldset-" + index}>
                {_renderFieldset({ fieldset })(
                  fieldset.columns.map((column, index) => (
                    <Fragment key={"column-" + index}>
                      {_renderColumn({ column })(
                        column.fields.map((field, index) => (
                          <Fragment key={id + "-field-" + index}>
                            {_renderField({ field })(
                              renderInput({ field }) ??
                                defaultRenderInput({ field }),
                            )}
                          </Fragment>
                        )),
                      )}
                    </Fragment>
                  )),
                )}
              </Fragment>
            )),
          )}
        </Fragment>
      ))}
      {children}
      {renderSubmitButton({ form })}
    </form>
  );
}

export default UmbracoForm;
