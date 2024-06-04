import React, { Fragment } from "react";
import { exhaustiveCheck } from "./utils";
import { shouldShowIndicator } from "./predicates";
import type {
  FormProps,
  PageProps,
  FieldsetProps,
  FieldProps,
  InputProps,
  ColumnProps,
  DefaultFormFieldTypeName,
} from "./types";
import { useUmbracoFormContext } from "./UmbracoForm";

export function DefaultForm({ form, ...rest }: FormProps): React.ReactNode {
  return (
    <form
      method="post"
      action={`/umbraco/forms/api/v1/entries/${form.id}`}
      target="_blank"
      {...rest}
      id={"form-" + form.id}
      name={form.id}
    />
  );
}

export function DefaultPage({
  page,
  pageIndex,
  children,
  condition,
}: PageProps): React.ReactNode {
  const { totalPages, currentPage } = useUmbracoFormContext();
  if (!condition) return null;
  if (totalPages > 1 && currentPage !== pageIndex) {
    return null;
  }
  return (
    <Fragment>
      {page.caption ? <h2>{page.caption}</h2> : null}
      {children}
    </Fragment>
  );
}

export function DefaultFieldset({
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

export function DefaultColumn({
  column,
  children,
}: ColumnProps): React.ReactNode {
  return (
    <Fragment>
      {column.caption ? <h4>{column.caption}</h4> : null}
      {children}
    </Fragment>
  );
}

export function DefaultField({
  field,
  children,
  condition,
  issues,
}: FieldProps): React.ReactNode {
  const context = useUmbracoFormContext();
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

export function DefaultInput({
  field,
  issues,
  ...rest
}: InputProps): React.ReactNode {
  const context = useUmbracoFormContext();
  const { shouldValidate, shouldUseNativeValidation } = context.config;
  const hasIssues = issues && issues?.length > 0;
  const validate = shouldValidate && shouldUseNativeValidation;

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

export function DefaultSubmitButton(
  props: React.HTMLAttributes<HTMLButtonElement>,
): React.ReactNode {
  const { form, totalPages, currentPage } = useUmbracoFormContext();
  if (totalPages > 1 && currentPage !== totalPages - 1) {
    return null;
  }
  return (
    <button type="submit" {...props}>
      {form.submitLabel}
    </button>
  );
}

export function DefaultNextButton(
  props: React.HTMLAttributes<HTMLButtonElement>,
): React.ReactNode {
  const { form, totalPages, currentPage } = useUmbracoFormContext();
  if (currentPage === totalPages - 1) {
    return null;
  }
  return (
    <button type="button" {...props}>
      {form.nextLabel}
    </button>
  );
}

export function DefaultPreviousButton(
  props: React.HTMLAttributes<HTMLButtonElement>,
): React.ReactNode {
  const { form, currentPage } = useUmbracoFormContext();
  if (currentPage === 0) {
    return null;
  }
  return (
    <button type="button" {...props}>
      {form.previousLabel}
    </button>
  );
}
