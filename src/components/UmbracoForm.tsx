import React, {
  Fragment,
  useCallback,
  useState,
  useTransition,
  useDeferredValue,
} from "react";
import type { ZodIssue } from "zod";
import type { UmbracoFormConfig, DtoWithCondition, FormDto } from "./types";
import {
  getAllFieldsOnPage,
  filterFieldsByConditions,
  getFieldByZodIssue,
} from "./field-utils";
import {
  coerceFormData,
  sortZodIssuesByFieldAlias,
  umbracoFormToZod,
} from "./umbraco-form-to-zod";
import * as defaultComponents from "./default-components";
import { isConditionFulfilled } from "./conditions";

type RenderFn<T extends React.JSXElementConstructor<any>> = (
  props: React.ComponentProps<T>,
) => React.ReactNode;

export interface UmbracoFormProps
  extends React.FormHTMLAttributes<HTMLFormElement> {
  form: FormDto;
  config?: Partial<UmbracoFormConfig>;
  renderForm?: RenderFn<typeof defaultComponents.Form>;
  renderPage?: RenderFn<typeof defaultComponents.Page>;
  renderFieldset?: RenderFn<typeof defaultComponents.Fieldset>;
  renderColumn?: RenderFn<typeof defaultComponents.Column>;
  renderField?: RenderFn<typeof defaultComponents.Field>;
  renderFieldType?: RenderFn<typeof defaultComponents.FieldType>;
  renderValidationSummary?: RenderFn<
    typeof defaultComponents.ValidationSummary
  >;
  renderSubmitButton?: RenderFn<typeof defaultComponents.SubmitButton>;
  renderNextButton?: RenderFn<typeof defaultComponents.NextButton>;
  renderPreviousButton?: RenderFn<typeof defaultComponents.PreviousButton>;
}

function UmbracoForm(props: UmbracoFormProps) {
  const [, startValidationTransition] = useTransition();
  const {
    form,
    config: configOverride = {},
    renderForm: Form = defaultComponents.Form,
    renderPage: Page = defaultComponents.Page,
    renderFieldset: Fieldset = defaultComponents.Fieldset,
    renderColumn: Column = defaultComponents.Column,
    renderField: Field = defaultComponents.Field,
    renderFieldType: FieldType = defaultComponents.FieldType,
    renderSubmitButton: SubmitButton = defaultComponents.SubmitButton,
    renderNextButton: NextButton = defaultComponents.NextButton,
    renderPreviousButton: PreviousButton = defaultComponents.PreviousButton,
    renderValidationSummary:
      ValidationSummary = defaultComponents.ValidationSummary,
    children,
    onChange,
    onSubmit,
    onBlur,
    ...rest
  } = props;

  const config = {
    schema: configOverride?.schema ?? umbracoFormToZod(form),
    shouldValidate: false,
    shouldUseNativeValidation: false,
    validateMode: "onSubmit",
    reValidateMode: "onBlur",
    ...configOverride,
  } as UmbracoFormConfig;

  const [internalData, setInternalData] = useState<Record<string, unknown>>({});
  const deferredInternalData = useDeferredValue(internalData);

  const [attemptCount, setAttemptCount] = useState<number>(0);
  const [formIssues, setFormIssues] = useState<ZodIssue[]>([]);
  const [summaryIssues, setSummaryIssues] = useState<ZodIssue[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

  const checkCondition = (dto: DtoWithCondition) =>
    isConditionFulfilled(
      dto,
      form,
      deferredInternalData,
      config?.mapCustomFieldToZodType,
    );

  const validateFormData = useCallback(
    (coercedData: Record<string, unknown>, fieldName?: string) => {
      const parsedForm = config?.schema?.safeParse(coercedData);
      if (parsedForm?.success) {
        setFormIssues([]);
      } else if (parsedForm?.error?.issues) {
        setFormIssues((prev) =>
          sortZodIssuesByFieldAlias(
            form,
            fieldName
              ? [
                  ...prev.filter((issue) => issue.path.join(".") !== fieldName),
                  ...parsedForm.error.issues.filter(
                    (issue) => issue.path.join(".") === fieldName,
                  ),
                ]
              : parsedForm.error.issues,
          ),
        );
      }
      return parsedForm;
    },
    [form, config.schema],
  );

  const isCurrentPageValid = useCallback(() => {
    const activePage = form?.pages?.[currentPage];

    // dont validate fields that are not visible to the user
    const fieldsWithConditionsMet = filterFieldsByConditions(
      form,
      deferredInternalData,
      config.mapCustomFieldToZodType,
    ).map((field) => field.alias);

    // get all fields with issues and filter out fields with conditions that are not met
    const allFieldIssues = validateFormData(
      deferredInternalData,
    ).error?.issues?.filter((issue) =>
      fieldsWithConditionsMet.includes(getFieldByZodIssue(form, issue)?.alias),
    );

    // get all aliases for fields with issues
    const fieldAliasesWithIssues = allFieldIssues?.map(
      (issue) => getFieldByZodIssue(form, issue)?.alias,
    );

    // get all fields on the current page and filter out fields with conditions that are not met
    // so that they wont block the user from going to the next page
    const fieldsOnPage = getAllFieldsOnPage(activePage)?.filter((field) =>
      fieldsWithConditionsMet.includes(field?.alias),
    );

    const aliasesOnPage = fieldsOnPage?.map((field) => field?.alias) ?? [];

    const pageIssues =
      allFieldIssues?.filter((issue) =>
        aliasesOnPage?.includes(getFieldByZodIssue(form, issue)?.alias),
      ) ?? [];

    if (
      fieldsOnPage?.some(
        (field) => field && fieldAliasesWithIssues?.includes(field.alias),
      )
    ) {
      // prevent user from going to next page if there are fields with issues on the current page

      setAttemptCount((prev) => prev + 1);
      if (form.showValidationSummary) {
        setSummaryIssues(pageIssues);
      }
      return false;
    }
    return true;
  }, [
    config.shouldValidate,
    form,
    validateFormData,
    currentPage,
    deferredInternalData,
  ]);

  const handleOnChange = useCallback(
    (e: React.ChangeEvent<HTMLFormElement>) => {
      const field = e.target;
      const formData = new FormData(e.currentTarget);
      const coercedData = coerceFormData(formData, config.schema);
      setInternalData(coercedData);

      if (config.shouldValidate) {
        const validateOnChange =
          config.validateMode === "onChange" ||
          config.validateMode === "all" ||
          (attemptCount > 0 && config.reValidateMode === "onChange");

        if (validateOnChange) {
          startValidationTransition(() => {
            if (validateFormData(coercedData, field.name).success === false) {
              return;
            }
            if (typeof onChange === "function") {
              onChange(e);
            }
          });
        }
      } else if (typeof onChange === "function") {
        onChange(e);
      }
    },
    [config.schema, config.shouldValidate, attemptCount, validateFormData],
  );

  const handleOnBlur = useCallback(
    (e: React.FocusEvent<HTMLFormElement, HTMLElement>) => {
      const field = e.target;
      const formData = new FormData(e.currentTarget as HTMLFormElement);
      const coercedData = coerceFormData(formData, config.schema);

      if (config.shouldValidate) {
        const validateOnBlur =
          config.validateMode === "onBlur" ||
          config.validateMode === "all" ||
          (attemptCount > 0 && config.reValidateMode === "onBlur");

        if (validateOnBlur) {
          startValidationTransition(() => {
            validateFormData(coercedData, field.name);
            if (form.pages && form.pages?.length > 1) {
              isCurrentPageValid();
            }
          });
        }
      }

      if (typeof onBlur === "function") {
        onBlur(e);
      }
    },
    [validateFormData, form, isCurrentPageValid, config.shouldValidate],
  );

  const scrollToTopOfForm = useCallback(() => {
    const formElement = document.getElementById("[name='" + form.id + "']");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [form]);

  const focusFirstInvalidField = useCallback(() => {
    const fieldWithIssues = formIssues?.find((issue) => issue.path.length > 0);
    if (fieldWithIssues) {
      const fieldId = fieldWithIssues.path.join(".");
      if (fieldId) {
        const fieldElement = document.querySelector(
          '[name="' + fieldId + '"]',
        ) as HTMLInputElement;
        if (fieldElement) {
          fieldElement.focus();
        }
      }
    }
  }, [formIssues]);

  const handleNextPage = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (
        config.shouldValidate &&
        (config.validateMode === "onSubmit" || config.validateMode === "all")
      ) {
        startValidationTransition(() => {
          if (isCurrentPageValid() === false) {
            scrollToTopOfForm();
            focusFirstInvalidField();
            setAttemptCount((prev) => prev + 1);
            return;
          }
          setCurrentPage((prev) => prev + 1);
          setAttemptCount(0);
        });
      } else {
        setCurrentPage((prev) => prev + 1);
      }
    },
    [
      isCurrentPageValid,
      focusFirstInvalidField,
      scrollToTopOfForm,
      config.shouldValidate,
    ],
  );

  const handlePreviousPage = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setCurrentPage((prev) => (prev === 0 ? prev : prev - 1));
      scrollToTopOfForm();
    },
    [scrollToTopOfForm],
  );

  const handleOnSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      if (config.shouldValidate) {
        e.preventDefault();
        startValidationTransition(() => {
          setAttemptCount((prev) => prev + 1);
          const submitData = coerceFormData(
            new FormData(e.currentTarget),
            config.schema,
          );
          const validationResult = validateFormData(submitData);
          if (validationResult.success === false) {
            focusFirstInvalidField();
            if (form.showValidationSummary) {
              setSummaryIssues(validationResult.error.issues);
            }
            return;
          }
          setSummaryIssues([]);
          if (typeof onSubmit === "function") {
            onSubmit(e);
          }
        });
      } else {
        if (typeof onSubmit === "function") {
          onSubmit(e);
        }
      }
    },
    [focusFirstInvalidField, config.schema, onSubmit],
  );

  const context = {
    form,
    config,
  };

  const totalPages = form?.pages?.filter(checkCondition).length ?? 1;

  return (
    <Fragment>
      {form.showValidationSummary && attemptCount > 0 ? (
        <ValidationSummary {...context} issues={summaryIssues} />
      ) : null}
      <Form
        {...rest}
        onChange={handleOnChange}
        onSubmit={handleOnSubmit}
        onBlur={handleOnBlur}
        {...context}
      >
        {form?.pages?.map((page, index) => (
          <Page
            key={"page." + index}
            page={page}
            pageIndex={index}
            condition={checkCondition(page)}
            currentPage={currentPage}
            totalPages={totalPages}
            {...context}
          >
            {page?.fieldsets?.map((fieldset, index) => (
              <Fieldset
                key={"fieldset." + index}
                fieldset={fieldset}
                condition={checkCondition(fieldset)}
                {...context}
              >
                {fieldset?.columns?.map((column, index) => (
                  <Column key={"column." + index} column={column} {...context}>
                    {column?.fields?.map((field) => {
                      const issues = formIssues?.filter(
                        (issue) => issue.path.join(".") === field.alias,
                      );
                      const fieldTypeProps = { field, issues, ...context };
                      return (
                        <Field
                          key={"field." + field?.id}
                          field={field}
                          condition={checkCondition(field)}
                          issues={issues}
                          {...context}
                        >
                          {
                            // fallback to default component if custom component returns undefined
                            FieldType(fieldTypeProps) ??
                              defaultComponents.FieldType(fieldTypeProps)
                          }
                        </Field>
                      );
                    })}
                  </Column>
                ))}
              </Fieldset>
            ))}
          </Page>
        ))}
        {children}
        {totalPages > 1 ? (
          <Fragment>
            <PreviousButton
              onClick={handlePreviousPage}
              currentPage={currentPage}
              totalPages={totalPages}
              {...context}
            />
            <NextButton
              onClick={handleNextPage}
              currentPage={currentPage}
              totalPages={totalPages}
              {...context}
            />
          </Fragment>
        ) : null}
        <SubmitButton
          currentPage={currentPage}
          totalPages={totalPages}
          {...context}
        />
      </Form>
    </Fragment>
  );
}

UmbracoForm.FieldType = defaultComponents.FieldType;
UmbracoForm.Page = defaultComponents.Page;
UmbracoForm.Fieldset = defaultComponents.Fieldset;
UmbracoForm.Column = defaultComponents.Column;
UmbracoForm.Field = defaultComponents.Field;
UmbracoForm.SubmitButton = defaultComponents.SubmitButton;
UmbracoForm.ValidationSummary = defaultComponents.ValidationSummary;

export { umbracoFormToZod, coerceFormData };
export type * from "./types";
export default UmbracoForm;
