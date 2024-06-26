export default {
  disableDefaultStylesheet: false,
  fieldIndicationType: "MarkMandatoryFields",
  hideFieldValidation: false,
  id: "34ef4a19-efa7-40c1-b8b6-2fd7257f2ed3",
  indicator: "*",
  messageOnSubmit: "Thanks for submitting the form",
  name: "Simple Comment Form",
  nextLabel: "Next",
  pages: [
    {
      caption: "Your comment",
      fieldsets: [
        {
          caption: "",
          columns: [
            {
              caption: "",
              width: 12,
              fields: [
                {
                  alias: "name",
                  caption: "Name",
                  condition: {
                    actionType: "Show",
                    logicType: "All",
                    rules: [],
                  },
                  helpText: "[#message] from [#pageName]",
                  id: "25185934-9a61-491c-9610-83dfe774662c",
                  pattern: "",
                  patternInvalidErrorMessage:
                    "Please provide a valid value for Name",
                  placeholder: "John Doe",
                  preValues: [],
                  required: true,
                  requiredErrorMessage: "Please provide a value for Name",
                  settings: {
                    defaultValue: "",
                    placeholder: "Please enter your name.",
                    showLabel: "",
                    maximumLength: "",
                    fieldType: "",
                    autocompleteAttribute: "",
                  },
                  type: {
                    id: "3f92e01b-29e2-4a30-bf33-9df5580ed52c",
                    name: "Short answer",
                  },
                },
                {
                  alias: "email",
                  caption: "Email",
                  condition: {
                    actionType: "Show",
                    logicType: "All",
                    rules: [],
                  },
                  helpText: "",
                  id: "816fdf3b-a796-4677-a317-943a54bf9d55",
                  pattern:
                    "^[_a-z0-9-]+(\\.[_a-z0-9-]+)*@[a-z0-9-]+(\\.[a-z0-9-]+)*(\\.[a-z]{2,4})$",
                  patternInvalidErrorMessage:
                    "Please provide a valid value for Email",
                  placeholder: "email@example.com",
                  preValues: [],
                  required: true,
                  requiredErrorMessage: "Please provide a value for Email",
                  settings: {
                    defaultValue: "",
                    placeholder: "",
                    showLabel: "",
                    maximumLength: "",
                    fieldType: "email",
                    autocompleteAttribute: "",
                  },
                  type: {
                    id: "3f92e01b-29e2-4a30-bf33-9df5580ed52c",
                    name: "Short answer",
                  },
                },
                {
                  alias: "comment",
                  caption: "Comment",
                  condition: {
                    actionType: "Show",
                    logicType: "All",
                    rules: [],
                  },
                  helpText: "",
                  id: "9d723100-ec34-412f-aaa5-516634d7c833",
                  pattern: "",
                  patternInvalidErrorMessage:
                    "Please provide a valid value for Comment",
                  placeholder: "Share your thoughts...",
                  preValues: [],
                  required: false,
                  requiredErrorMessage: "Please provide a value for Comment",
                  settings: {
                    defaultValue: "",
                    placeholder: "",
                    showLabel: "",
                    autocompleteAttribute: "",
                    numberOfRows: "2",
                    maximumLength: "",
                  },
                  type: {
                    id: "023f09ac-1445-4bcb-b8fa-ab49f33bd046",
                    name: "Long answer",
                  },
                },
                {
                  alias: "date",
                  caption: "Date",
                  condition: {
                    actionType: "Show",
                    logicType: "All",
                    rules: [],
                  },
                  helpText: "",
                  id: "8d723100-ec34-412f-aaa5-516634d7c833",
                  pattern: "",
                  patternInvalidErrorMessage:
                    "Please provide a valid value for Date",
                  placeholder: "Date",
                  preValues: [],
                  required: false,
                  requiredErrorMessage: "Please provide a value for Date",
                  settings: {
                    placeholder: "",
                  },
                  type: {
                    id: "f8b4c3b8-af28-11de-9dd8-ef5956d89593",
                    name: "Date",
                  },
                },
                {
                  alias: "country",
                  caption: "Country",
                  condition: {
                    actionType: "Show",
                    logicType: "All",
                    rules: [],
                  },
                  helpText: "",
                  id: "30ff8f37-28d4-47df-f281-422b36c62e73",
                  pattern: "",
                  patternInvalidErrorMessage:
                    "Please provide a valid value for Country",
                  placeholder: "",
                  preValues: [
                    {
                      caption: "France",
                      value: "fr",
                    },
                    {
                      caption: "Italy",
                      value: "it",
                    },
                    {
                      caption: "Span",
                      value: "es",
                    },
                    {
                      caption: "United Kingdom",
                      value: "gb",
                    },
                  ],
                  required: false,
                  requiredErrorMessage: "Please provide a value for Country",
                  settings: {
                    defaultValue: "",
                    allowMultipleSelections: "",
                    showLabel: "",
                    autocompleteAttribute: "",
                    selectPrompt: "Please select",
                  },
                  type: {
                    id: "0dd29d42-a6a5-11de-a2f2-222256d89593",
                    name: "Dropdown",
                  },
                },
                {
                  alias: "favouriteColour",
                  caption: "Favourite Colour",
                  condition: {
                    actionType: "Show",
                    logicType: "All",
                    rules: [],
                  },
                  helpText: "",
                  id: "a6e2e27f-097d-476a-edb9-4aa79449ab5c",
                  pattern: "",
                  patternInvalidErrorMessage:
                    "Please provide a valid value for Favourite Colour",
                  placeholder: "",
                  preValues: [
                    {
                      caption: "Red",
                      value: "red",
                    },
                    {
                      caption: "Green",
                      value: "green",
                    },
                    {
                      caption: "Yellow",
                      value: "yellow",
                    },
                  ],
                  required: false,
                  requiredErrorMessage:
                    "Please provide a value for Favourite Colour",
                  settings: {
                    defaultValue: "",
                    showLabel: "",
                  },
                  type: {
                    id: "fab43f20-a6bf-11de-a28f-9b5755d89593",
                    name: "Multiple choice",
                  },
                },
                {
                  alias: "dataConsent",
                  caption: "Data consent",
                  condition: {
                    actionType: "Show",
                    logicType: "All",
                    rules: [],
                  },
                  helpText: "Please indicate if it's OK to store your data.",
                  id: "9f25acaf-4ac4-4105-9afe-eb0bb0c03b31",
                  pattern: "",
                  patternInvalidErrorMessage:
                    "Please provide a valid value for Data consent",
                  placeholder: "",
                  preValues: [],
                  required: true,
                  requiredErrorMessage: "Please confirm your data consent",
                  settings: {
                    acceptCopy:
                      "Yes, I give permission to store and process my data.",
                    showLabel: "",
                  },
                  type: {
                    id: "a72c9df9-3847-47cf-afb8-b86773fd12cd",
                    name: "Data Consent",
                  },
                },
                {
                  alias: "tickToAddMoreInfo",
                  caption: "Tick to add more info",
                  condition: {
                    actionType: "Show",
                    logicType: "All",
                    rules: [],
                  },
                  helpText: "",
                  id: "6ce0cf78-5102-47c1-85c6-9530d9e9c6a6",
                  pattern: "",
                  patternInvalidErrorMessage:
                    "Please provide a valid value for Tick to add more info",
                  placeholder: "",
                  preValues: [],
                  required: false,
                  requiredErrorMessage:
                    "Please provide a value for Tick to add more info",
                  settings: {
                    defaultValue: "",
                  },
                  type: {
                    id: "d5c0c390-ae9a-11de-a69e-666455d89593",
                    name: "Checkbox",
                  },
                },
                {
                  alias: "moreInfo",
                  caption: "More info",
                  condition: {
                    actionType: "Show",
                    logicType: "All",
                    rules: [
                      {
                        field: "6ce0cf78-5102-47c1-85c6-9530d9e9c6a6",
                        operator: "Is",
                        value: "on",
                      },
                      {
                        field: "8d723100-ec34-412f-aaa5-516634d7c833",
                        operator: "GreaterThen",
                        value: "2022-01-01",
                      },
                    ],
                  },
                  helpText: "",
                  id: "5b4100ed-cc5e-4113-943c-ee5a8f4e448d",
                  pattern: "",
                  patternInvalidErrorMessage:
                    "Please provide a valid value for More info",
                  placeholder: "",
                  preValues: [],
                  required: true,
                  requiredErrorMessage: "Please provide a value for More info",
                  settings: {
                    defaultValue: "",
                    placeholder: "",
                    showLabel: "",
                    maximumLength: "",
                    fieldType: "",
                    autocompleteAttribute: "",
                  },
                  type: {
                    id: "3f92e01b-29e2-4a30-bf33-9df5580ed52c",
                    name: "Short answer",
                  },
                },
              ],
            },
          ],
          id: "d677b96f-488d-4052-b00d-fb852b35e9c5",
        },
      ],
    },
  ],
  previousLabel: "Previous",
  showValidationSummary: true,
  submitLabel: "Submit",
};
