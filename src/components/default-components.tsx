import React, { Fragment } from "react";
import { shouldShowIndicator } from "./predicates";
import { match } from "ts-pattern";
import { useUmbracoFormContext } from "./UmbracoForm";
import { getAttributesForFieldType, getFieldByZodIssue } from "./field-utils";
import { getIssueId } from "./umbraco-form-to-zod";
import type { ZodIssue } from "zod";
import {
  DefaultFieldType,
  type FormDto,
  type FormPageDto,
  type FormFieldsetDto,
  type FormFieldsetColumnDto,
  type FormFieldDto,
  type FieldSettings,
} from "./types";

type RenderProps = React.HTMLAttributes<HTMLElement> &
  (
    | { page: FormPageDto; condition: boolean }
    | { fieldset: FormFieldsetDto; condition: boolean }
    | { column: FormFieldsetColumnDto }
    | { field: FormFieldDto; condition: boolean }
  );

type FormProps = {
  form: FormDto;
} & React.FormHTMLAttributes<HTMLFormElement>;

export function Form({ form, ...rest }: FormProps) {
  return (
    <form
      method="post"
      action={`/umbraco/forms/api/v1/entries/${form.id}`}
      target="_blank"
      {...rest}
      id={"form:" + form.id}
      name={form.id}
    />
  );
}

type PageProps = RenderProps & {
  page: FormPageDto;
  pageIndex: number;
  condition: boolean;
} & React.HTMLAttributes<HTMLElement>;

export function Page({
  page,
  pageIndex,
  children,
  condition,
  ...rest
}: PageProps) {
  const { currentPage } = useUmbracoFormContext();
  if (!condition) return null;
  const pageIsActive = currentPage === pageIndex;

  return (
    <section style={pageIsActive ? {} : { display: "none" }} {...rest}>
      {page.caption ? (
        <header>
          <h2>{page.caption}</h2>
        </header>
      ) : null}
      {children}
    </section>
  );
}

export type FieldsetProps = RenderProps & {
  fieldset: FormFieldsetDto;
  condition: boolean;
};

export function Fieldset({ fieldset, children, condition }: FieldsetProps) {
  if (!condition) return null;
  return (
    <Fragment>
      {fieldset.caption ? <h3>{fieldset.caption}</h3> : null}
      {children}
    </Fragment>
  );
}

export type ColumnProps = RenderProps & {
  column: FormFieldsetColumnDto;
};

export function Column({ column, children }: ColumnProps) {
  return (
    <Fragment>
      {column.caption ? <h4>{column.caption}</h4> : null}
      {children}
    </Fragment>
  );
}

export type FieldProps = RenderProps & {
  field: FormFieldDto;
  condition: boolean;
  issues?: ZodIssue[];
};

export function Field({ field, children, condition, issues }: FieldProps) {
  const context = useUmbracoFormContext();
  if (!condition) return null;
  const hasIssues = issues && issues.length > 0;
  const showValidationErrors =
    hasIssues && context.form.hideFieldValidation !== true;
  const indicator = shouldShowIndicator(field, context.form)
    ? context.form.indicator
    : null;
  const helpTextId = field.helpText ? "helpText:" + field.id : undefined;
  const helpText = field.helpText ? (
    <span id={helpTextId}>{field.helpText}</span>
  ) : null;
  const validationErrors = showValidationErrors ? (
    <span id={getIssueId(field, issues[0])}>{issues?.[0]?.message}</span>
  ) : null;

  if (field.type?.id === DefaultFieldType.SingleChoice) {
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

  if (field.type?.id === DefaultFieldType.MultipleChoice) {
    const checkboxGroupId = "checkboxgroup:" + field.id;
    return (
      <fieldset aria-labelledby={checkboxGroupId}>
        <legend id={checkboxGroupId}>
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

export type FieldTypeProps = Omit<FieldProps, "children" | "condition">;

export function FieldType({
  field,
  issues,
  ...rest
}: FieldTypeProps): React.ReactNode | undefined {
  const context = useUmbracoFormContext();
  const fieldTypeAttributes = getAttributesForFieldType(field, issues, context);

  const attributes = {
    ...fieldTypeAttributes,
    ...rest,
  };

  return match(field?.type?.id)
    .with(
      DefaultFieldType.ShortAnswer,
      DefaultFieldType.Checkbox,
      DefaultFieldType.DataConsent,
      DefaultFieldType.FileUpload,
      DefaultFieldType.Recaptcha2,
      DefaultFieldType.RecaptchaV3WithScore,
      DefaultFieldType.HiddenField,
      DefaultFieldType.Date,
      DefaultFieldType.Password,
      () => <input {...attributes} />,
    )
    .with(DefaultFieldType.LongAnswer, DefaultFieldType.RichText, () => (
      <textarea {...attributes} />
    ))
    .with(
      DefaultFieldType.SingleChoice,
      DefaultFieldType.MultipleChoice,
      (uuid) => (
        <Fragment>
          {field?.preValues?.map((preValue) => {
            const settings = field?.settings as FieldSettings[typeof uuid];
            const id = preValue.value + ":" + field.id;
            return (
              <Fragment key={id}>
                <label htmlFor={id}>{preValue.caption}</label>
                <input
                  defaultChecked={settings.defaultValue === preValue.value}
                  {...attributes}
                  id={id}
                  type={
                    field.type?.id === DefaultFieldType.MultipleChoice
                      ? "checkbox"
                      : "radio"
                  }
                  value={preValue.value}
                />
              </Fragment>
            );
          })}
        </Fragment>
      ),
    )
    .with(DefaultFieldType.DropdownList, () => (
      <select {...attributes}>
        {field?.preValues?.map((preValue) => (
          <option key={`${field.id}.${preValue.value}`} value={preValue.value}>
            {preValue.caption}
          </option>
        ))}
      </select>
    ))
    .with(DefaultFieldType.TitleAndDescription, (uuid) => {
      const settings = field?.settings as FieldSettings[typeof uuid];
      return (
        <div>
          <h2>{settings.caption}</h2>
          <p>{settings.bodyText}</p>
        </div>
      );
    })
    .exhaustive();
}

export function SubmitButton(props: React.HTMLAttributes<HTMLButtonElement>) {
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

export function NextButton(props: React.HTMLAttributes<HTMLButtonElement>) {
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

export function PreviousButton(props: React.HTMLAttributes<HTMLButtonElement>) {
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

export type ValidationSummaryProps = {
  form: FormDto;
  issues: ZodIssue[] | undefined;
};

export function ValidationSummary(props: ValidationSummaryProps) {
  const { form, issues } = props;
  const hasIssues = issues && issues.length > 0;
  if (!hasIssues) return null;

  return (
    <section role="alert">
      <ol>
        {issues?.map((issue) => {
          const field = getFieldByZodIssue(form, issue);
          const id = getIssueId(field, issue);
          return (
            <li key={id} id={id}>
              {issue.message}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
