import "./App.css";
import { useState } from "react";
import clsx from "clsx";
import UmbracoForm from "./components/UmbracoForm";
import formDefinition from "./form-definition";
import { FormDto } from "./components/types";
import {
  coerceFormData,
  umbracoFormToZod,
} from "./components/umbraco-form-to-zod";

const form = formDefinition as unknown as FormDto;

const schema = umbracoFormToZod(form);

function App() {
  const [sentForm, setSentForm] = useState<Object | undefined>();
  return (
    <div className="p-4">
      {sentForm ? (
        <div className="space-y-4 mb-4">
          {form?.messageOnSubmit}
          <pre>{JSON.stringify(sentForm, null, 2)}</pre>
        </div>
      ) : (
        <UmbracoForm
          form={form}
          config={{ schema, shouldValidate: true }}
          renderPage={(props) => (
            <div className="space-y-4 mb-4">
              <UmbracoForm.Page {...props} />
            </div>
          )}
          renderColumn={(props) => (
            <div className="space-y-6">
              <UmbracoForm.Column {...props} />
            </div>
          )}
          renderField={(props) => (
            <div className="grid">
              <UmbracoForm.Field {...props} />
            </div>
          )}
          renderInput={(props) => (
            <UmbracoForm.Input
              {...props}
              className={clsx({
                rounded: props.field?.type?.name !== "Multiple choice",
              })}
            />
          )}
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const formData = new FormData(form);
            const values = coerceFormData(formData, schema);
            setSentForm(values);
          }}
        />
      )}
    </div>
  );
}

export default App;
