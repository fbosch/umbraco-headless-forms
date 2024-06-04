import React, {
  Fragment,
  createContext,
  useCallback,
  useState,
  useContext,
} from "react";
import type {
  BaseSchema,
  UmbracoFormContext,
  UmbracoFormConfig,
  FormDto,
  FormProps,
  PageProps,
  ColumnProps,
  InputProps,
  FieldsetProps,
  FieldProps,
  DtoWithCondition,
  FormPageDto,
} from "./types";
import { getAllFieldsOnPage, filterFieldsByConditions } from "./utils";
import {
  coerceFormData,
  umbracoFormToZod,
  omitFieldsBasedOnConditionFromData,
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
    children,
    onChange,
    onSubmit,
    ...rest
  } = props;

  const config: UmbracoFormConfig = {
    schema: configOverride?.schema ?? umbracoFormToZod(form, configOverride),
    shouldValidate: false,
    shouldUseNativeValidation: false,
    ...configOverride,
  };

  const [submitAttempts, setSubmitAttempts] = useState<number>(0);
  const [formData, setFormData] = useState<FormData | undefined>(undefined);
  const [data, setData] = useState<BaseSchema>({});
  const [formIssues, setFormIssues] = useState<ZodIssue[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

  const checkCondition = (dto: DtoWithCondition) =>
    isConditionFulfilled(dto, form, data, config);

  const totalPages = form?.pages?.filter(checkCondition).length ?? 1;

  const validateFormData = useCallback(
    (coercedData: BaseSchema) => {
      const dataWithConditionalFieldsOmitted =
        omitFieldsBasedOnConditionFromData(form, coercedData, config);
      console.log(dataWithConditionalFieldsOmitted);
      const parsedForm = config?.schema?.safeParse(coercedData);
      if (parsedForm?.success) {
        setFormIssues([]);
      } else if (parsedForm?.error?.issues) {
        setFormIssues(parsedForm.error.issues);
      }
      return parsedForm;
    },
    [form],
  );

  const handleOnChange = (e: React.ChangeEvent<HTMLFormElement>) => {
    const formData = new FormData(e.currentTarget);
    const coercedData = coerceFormData(formData, config.schema);
    setFormData(formData);
    setData(coercedData);
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
  };

  const activePageDefinition = form?.pages?.[currentPage] as FormPageDto;

  const isCurrentPageValid = useCallback(() => {
    if (config.shouldValidate === false) {
      return true;
    }
    const fieldAliasesWithIssues = validateFormData(
      data,
    ).error?.issues?.flatMap((issue) => issue.path.join("."));

    const fieldsWithConditionsMet = filterFieldsByConditions(
      form,
      data,
      config,
    ).map((field) => field.alias);

    // get all fields on the current page and filter out fields with conditions that are not met
    // so that they wont block the user from going to the next page
    const fieldsOnPage = getAllFieldsOnPage(activePageDefinition)
      .map((field) => field.alias)
      .filter((field) => fieldsWithConditionsMet.includes(field));

    if (
      fieldsOnPage.some(
        (field) => field && fieldAliasesWithIssues?.includes(field),
      )
    ) {
      // prevent user from going to next page if there are fields with issues on the current page

      return false;
    }
    return true;
  }, [form, data, config, currentPage]);

  const focusFirstInvalidField = () => {
    const fieldWithIssues = validateFormData(data).error?.issues?.find(
      (issue) => issue.path.length > 0,
    );
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
  };

  const handleNextPage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isCurrentPageValid() === false) {
      focusFirstInvalidField();
      return;
    }
    setCurrentPage((prev) => prev + 1);
  };

  const handlePreviousPage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (currentPage === 0) {
      return;
    }
    setCurrentPage((prev) => prev - 1);
  };

  const handleOnSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setSubmitAttempts((prev) => prev + 1);
    if (config.shouldValidate && validateFormData(data).success === false) {
      e.preventDefault();
      focusFirstInvalidField();
      return;
    }
    if (typeof onSubmit === "function") {
      onSubmit(e);
    }
  };

  return (
    <UmbracoFormContext.Provider
      value={{
        form,
        formData,
        config,
        submitAttempts,
        totalPages,
        currentPage,
      }}
    >
      <Form
        form={form}
        {...rest}
        onChange={handleOnChange}
        onSubmit={handleOnSubmit}
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

export default UmbracoForm;
