import React, { Fragment } from "react";
import { exhaustiveCheck } from "./utils";
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
  const { shouldValidate, shouldUseNativeValidation } = context.config;
  const hasIssues = issues && issues?.length > 0;
  const validate = shouldValidate && shouldUseNativeValidation;

  let commonAttributes = {
    name: field.alias,
    id: field.id,
    required: validate && field.required ? field.required : undefined,
    ["aria-invalid"]: validate ? hasIssues : undefined,
    ["aria-errormessage"]:
      validate && hasIssues ? issues.at(0)?.message : undefined,
    ...rest,
  };

  const defaultValue = match(field?.type?.name)
    .with(
      "Short answer",
      "Long answer",
      "Checkbox",
      "Multiple choice",
      "Dropdown",
      (typeName) => {
        const settings =
          field?.settings as UmbracoFormFieldSettingsMap[typeof typeName];

        return settings?.defaultValue || undefined;
      },
    )
    .otherwise(() => undefined);

  const textAttributes = match(field?.type?.name).with(
    "Short answer",
    "Long answer",
    (typeName) => {
      const settings =
        field?.settings as UmbracoFormFieldSettingsMap[typeof typeName];
      return {
        autoComplete: settings?.autocompleteAttribute || undefined,
        placeholder: field.placeholder || undefined,
        pattern: validate && field.pattern ? field.pattern : undefined,
        maxLength:
          validate && settings?.maximumLength
            ? parseInt(settings?.maximumLength)
            : undefined,
      };
    },
  );

  return match(field?.type?.name)
    .with("Short answer", (typeName) => {
      const settings =
        field?.settings as UmbracoFormFieldSettingsMap[typeof typeName];
      return (
        <input
          type={settings?.fieldType || "text"}
          defaultValue={defaultValue}
          {...textAttributes}
          {...commonAttributes}
        />
      );
    })
    .with("Long answer", (typeName) => {
      const settings =
        field?.settings as UmbracoFormFieldSettingsMap[typeof typeName];
      return (
        <textarea
          defaultValue={defaultValue}
          {...textAttributes}
          {...commonAttributes}
          rows={
            settings?.numberOfRows ? parseInt(settings.numberOfRows) : undefined
          }
        />
      );
    })
    .with("Checkbox", () => (
      <input
        type="checkbox"
        defaultValue={defaultValue}
        {...commonAttributes}
      />
    ))
    .with("Multiple choice", () => (
      <Fragment>
        {field?.preValues?.map((preValue) => {
          const id = preValue.value + ":" + commonAttributes.id;
          return (
            <Fragment key={id}>
              <label htmlFor={id}>{preValue.caption}</label>
              <input
                defaultChecked={defaultValue === preValue.value}
                {...textAttributes}
                {...commonAttributes}
                id={id}
                type="radio"
                value={preValue.value}
              />
            </Fragment>
          );
        })}
      </Fragment>
    ))
    .with("Dropdown", (typeName) => {
      const settings =
        field?.settings as UmbracoFormFieldSettingsMap[typeof typeName];

      return (
        <select
          defaultValue={defaultValue}
          {...commonAttributes}
          multiple={!!settings?.allowMultipleSelections ?? false}
        >
          {field?.preValues?.map((preValue) => (
            <option
              key={`${commonAttributes.id}.${preValue.value}`}
              value={preValue.value}
            >
              {preValue.caption}
            </option>
          ))}
        </select>
      );
    })
    .with("Data Consent", () => <input type="checkbox" {...commonAttributes} />)
    .with("File upload", () => (
      <input
        type="file"
        {...commonAttributes}
        accept={field?.fileUploadOptions?.allowedUploadExtensions?.join(",")}
      />
    ))
    .with("Recaptcha2", () => <input type="hidden" {...commonAttributes} />)
    .with("Recaptcha v3 with score", () => (
      <input type="hidden" {...commonAttributes} />
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
