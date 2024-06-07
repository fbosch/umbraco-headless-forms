import React, {
  Fragment,
  createContext,
  useCallback,
  useState,
  useContext,
  useTransition,
  useRef,
} from "react";
import type {
  UmbracoFormContext,
  UmbracoFormConfig,
  FormDto,
  FormProps,
  PageProps,
  ColumnProps,
  InputProps,
  FieldsetProps,
  FieldProps,
  ValidationSummaryProps,
  DtoWithCondition,
} from "./types";
import {
  getAllFieldsOnPage,
  filterFieldsByConditions,
  getFieldByZodIssue,
} from "./utils";
import {
  coerceFormData,
  sortZodIssuesByFieldAlias,
  umbracoFormToZod,
} from "./umbraco-form-to-zod";
import { ZodIssue } from "zod";
import { isConditionFulfilled } from "./predicates";
import {
  DefaultForm,
  DefaultPage,
  DefaultFieldset,
  DefaultColumn,
  DefaultField,
  DefaultInput,
  DefaultSubmitButton,
  DefaultNextButton,
  DefaultPreviousButton,
  DefaultValidationSummary,
} from "./umbraco-form-default-components";

export interface UmbracoFormProps
  extends React.FormHTMLAttributes<HTMLFormElement> {
  requestToken?: string;
  form: FormDto;
  config?: Partial<UmbracoFormConfig>;
  renderForm?: (props: FormProps) => React.ReactNode;
  renderPage?: (props: PageProps) => React.ReactNode;
  renderFieldset?: (props: FieldsetProps) => React.ReactNode;
  renderColumn?: (props: ColumnProps) => React.ReactNode;
  renderField?: (props: FieldProps) => React.ReactNode;
  renderInput?: (props: InputProps) => React.ReactNode | undefined;
  renderValidationSummary?: (props: ValidationSummaryProps) => React.ReactNode;
  renderSubmitButton?: (
    props: React.HTMLAttributes<HTMLButtonElement>,
  ) => React.ReactNode;
  renderNextButton?: (
    props: React.HTMLAttributes<HTMLButtonElement>,
  ) => React.ReactNode;
  renderPreviousButton?: (
    props: React.HTMLAttributes<HTMLButtonElement>,
  ) => React.ReactNode;
}

const UmbracoFormContext = createContext<UmbracoFormContext>(
  {} as UmbracoFormContext,
);

export const useUmbracoFormContext = () => useContext(UmbracoFormContext);

function UmbracoForm(props: UmbracoFormProps) {
  const [, startValidationTransition] = useTransition();
  const {
    form,
    config: configOverride = {},
    renderForm: Form = DefaultForm,
    renderPage: Page = DefaultPage,
    renderFieldset: Fieldset = DefaultFieldset,
    renderColumn: Column = DefaultColumn,
    renderField: Field = DefaultField,
    renderInput: Input = DefaultInput,
    renderSubmitButton: SubmitButton = DefaultSubmitButton,
    renderNextButton: NextButton = DefaultNextButton,
    renderPreviousButton: PreviousButton = DefaultPreviousButton,
    renderValidationSummary: ValidationSummary = DefaultValidationSummary,
    children,
    onChange,
    onSubmit,
    onBlur,
    ...rest
  } = props;

  const config: UmbracoFormConfig = {
    schema: configOverride?.schema ?? umbracoFormToZod(form),
    shouldValidate: false,
    shouldUseNativeValidation: false,
    ...configOverride,
  };

  const [submitAttempts, setSubmitAttempts] = useState<number>(0);
  const internalDataRef = useRef<Record<string, unknown>>({});
  const [formIssues, setFormIssues] = useState<ZodIssue[]>([]);
  const [summaryIssues, setSummaryIssues] = useState<ZodIssue[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

  const checkCondition = (dto: DtoWithCondition) =>
    isConditionFulfilled(
      dto,
      form,
      internalDataRef.current,
      config?.mapCustomFieldToZodType,
    );

  const totalPages = form?.pages?.filter(checkCondition).length ?? 1;

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
      internalDataRef.current,
      config.mapCustomFieldToZodType,
    ).map((field) => field.alias);

    // get all fields with issues and filter out fields with conditions that are not met
    const allFieldIssues = validateFormData(
      internalDataRef.current,
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

      setSubmitAttempts((prev) => prev + 1);
      setSummaryIssues(pageIssues);
      return false;
    }
    return true;
  }, [config.shouldValidate, form, validateFormData, currentPage]);

  const handleOnChange = useCallback(
    (e: React.ChangeEvent<HTMLFormElement>) => {
      startValidationTransition(() => {
        const formData = new FormData(e.currentTarget);
        const coercedData = coerceFormData(formData, config.schema);
        internalDataRef.current = coercedData;
        if (
          config.shouldValidate &&
          submitAttempts > 0 &&
          validateFormData(coercedData).success === false
        ) {
          return;
        }
        if (typeof onChange === "function") {
          onChange(e);
        }
      });
    },
    [config.schema, config.shouldValidate, submitAttempts, validateFormData],
  );

  const handleOnBlur = useCallback(
    (e: React.FocusEvent<HTMLFormElement, HTMLElement>) => {
      const field = e.target;
      const formData = new FormData(e.currentTarget as HTMLFormElement);
      const coercedData = coerceFormData(formData, config.schema);
      internalDataRef.current = coercedData;

      if (config?.shouldValidate) {
        startValidationTransition(() => {
          validateFormData(coercedData, field.name);
          if (form.pages && form.pages?.length > 1) {
            isCurrentPageValid();
          }
        });
      }

      if (typeof onBlur === "function") {
        onBlur(e);
      }
    },
    [validateFormData, form, isCurrentPageValid],
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
      startValidationTransition(() => {
        if (config.shouldValidate) {
          if (isCurrentPageValid() === false) {
            scrollToTopOfForm();
            focusFirstInvalidField();
            setSubmitAttempts((prev) => prev + 1);
            return;
          }
        }
        setCurrentPage((prev) => prev + 1);
        setSubmitAttempts(0);
      });
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
        startValidationTransition(() => {
          setSubmitAttempts((prev) => prev + 1);
          const submitData = coerceFormData(
            new FormData(e.currentTarget),
            config.schema,
          );
          e.preventDefault();
          const validationResult = validateFormData(submitData);
          if (validationResult.success === false) {
            focusFirstInvalidField();
            setSummaryIssues(validationResult.error.issues);
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

  return (
    <UmbracoFormContext.Provider
      value={{
        form,
        config,
        submitAttempts,
        totalPages,
        currentPage,
      }}
    >
      {form.showValidationSummary && submitAttempts > 0 ? (
        <ValidationSummary form={form} issues={summaryIssues} />
      ) : null}
      <Form
        form={form}
        {...rest}
        onChange={handleOnChange}
        onSubmit={handleOnSubmit}
        onBlur={handleOnBlur}
      >
        {form?.pages?.map((page, index) => (
          <Page
            key={"page." + index}
            page={page}
            pageIndex={index}
            condition={checkCondition(page)}
          >
            {page?.fieldsets?.map((fieldset, index) => (
              <Fieldset
                key={"fieldset." + index}
                fieldset={fieldset}
                condition={checkCondition(fieldset)}
              >
                {fieldset?.columns?.map((column, index) => (
                  <Column key={"column." + index} column={column}>
                    {column?.fields?.map((field) => {
                      const issues = formIssues?.filter(
                        (issue) => issue.path.join(".") === field.alias,
                      );
                      const inputProps = { field, issues };
                      return (
                        <Field
                          key={"field." + field?.id}
                          field={field}
                          condition={checkCondition(field)}
                          issues={issues}
                        >
                          {
                            // fallback to default component if custom component returns undefined
                            Input(inputProps) ?? DefaultInput(inputProps)
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
            <PreviousButton onClick={handlePreviousPage} />
            <NextButton onClick={handleNextPage} />
          </Fragment>
        ) : null}
        <SubmitButton />
      </Form>
    </UmbracoFormContext.Provider>
  );
}

UmbracoForm.Input = DefaultInput;
UmbracoForm.Page = DefaultPage;
UmbracoForm.Fieldset = DefaultFieldset;
UmbracoForm.Column = DefaultColumn;
UmbracoForm.Field = DefaultField;
UmbracoForm.SubmitButton = DefaultSubmitButton;

export { umbracoFormToZod, coerceFormData };
export type * from "./types";
export default UmbracoForm;
