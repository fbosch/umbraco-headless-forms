import React, { Fragment } from "react";
import { shouldShowIndicator } from "./predicates";
import { match } from "ts-pattern";
import type {
  FormProps,
  PageProps,
  FieldsetProps,
  FieldProps,
  InputProps,
  ColumnProps,
  DefaultFormFieldTypeName,
  UmbracoFormFieldSettingsMap,
  ValidationSummaryProps,
} from "./types";
import { useUmbracoFormContext } from "./UmbracoForm";
import { getAttributesForFieldType, getFieldByAlias } from "./utils";
import { getIssueId } from "./umbraco-form-to-zod";

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
    const radioGroupId = "radiogroup:" + field.id;
    return (
      <fieldset role="radiogroup" aria-labelledby={radioGroupId}>
        <legend id={radioGroupId}>
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
  const fieldAttributes = getAttributesForFieldType(field, issues, context);

  const attributes = {
    ...fieldAttributes,
    ...rest,
  };

  return match(field?.type?.name)
    .with(
      "Short answer",
      "Checkbox",
      "Data Consent",
      "File upload",
      "Recaptcha2",
      "Recaptcha v3 with score",
      () => <input {...attributes} />,
    )
    .with("Long answer", () => <textarea {...attributes} />)
    .with("Multiple choice", (typeName) => (
      <Fragment>
        {field?.preValues?.map((preValue) => {
          const settings =
            field?.settings as UmbracoFormFieldSettingsMap[typeof typeName];
          const id = preValue.value + ":" + field.id;
          return (
            <Fragment key={id}>
              <label htmlFor={id}>{preValue.caption}</label>
              <input
                defaultChecked={settings.defaultValue === preValue.value}
                {...attributes}
                id={id}
                type="radio"
                value={preValue.value}
              />
            </Fragment>
          );
        })}
      </Fragment>
    ))
    .with("Dropdown", () => (
      <select {...attributes}>
        {field?.preValues?.map((preValue) => (
          <option key={`${field.id}.${preValue.value}`} value={preValue.value}>
            {preValue.caption}
          </option>
        ))}
      </select>
    ))
    .exhaustive();
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

export function DefaultValidationSummary(props: ValidationSummaryProps) {
  const { form, issues } = props;
  const hasIssues = issues && issues.length > 0;
  if (!hasIssues) return null;

  return (
    <section role="alert">
      <ol>
        {issues?.map((issue) => {
          const alias = issue.path.join(".");
          const field = getFieldByAlias(form, alias);
          const id = getIssueId(field, issue);
          return (
            <li key={id} id={id}>
              {field?.caption}: {issue.message}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
