import "./App.css";
import UmbracoForm from "./components/UmbracoForm";
import {
  umbracoFormToZod,
  coerceFormData,
} from "./components/umbraco-form-to-zod";
import formDefinition from "./form-definition";
import { FormDto } from "./components/types";

const data = formDefinition as unknown as FormDto;
const schema = umbracoFormToZod(data);

function App() {
  return (
    <div className="p-4">
      <UmbracoForm
        form={data}
        renderPage={(props) => (
          <div className="space-y-4">
            {props.page.caption ? (
              <h2 className="text-3xl">{props.page.caption}</h2>
            ) : null}
            {props.children}
          </div>
        )}
        renderColumn={(props) => (
          <div className="space-y-4">
            <UmbracoForm.Column {...props} />
          </div>
        )}
        renderField={(props) => (
          <div className="flex flex-col space-y-2">
            <UmbracoForm.Field {...props} />
          </div>
        )}
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const formData = new FormData(form);
          console.log(Object.fromEntries(formData.entries()));
        }}
        onChange={(e) => {
          const form = e.currentTarget as HTMLFormElement;
          const formData = new FormData(form);

          const values = Object.fromEntries(formData.entries());

          const coercedValues = coerceFormData(formData, schema);

          // try {
          //   schema.parse(values);
          // } catch (error) {
          //   const validationError = fromError(error);
          //   console.log(validationError);
          // }
        }}
      />
    </div>
  );
}

export default App;
