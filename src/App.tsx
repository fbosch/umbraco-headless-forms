import "./App.css";
import UmbracoForm from "./components/UmbracoForm";
import { z } from "zod";
import { fromError } from "zod-validation-error";
import { umbracoFormToZod } from "./components/umbraco-form-to-zod";
import type { UmbracoFormDefinition } from "./components/umbraco-form.types";
import formData from "./form-data";

const schema = umbracoFormToZod(formData as UmbracoFormDefinition);

function App() {
  return (
    <div className="p-4">
      <UmbracoForm
        form={formData as UmbracoFormDefinition}
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
          let values: z.infer<typeof schema> = {};

          // TODO: find a way to parse form data using the zod schema to handle boolean values etc.

          // for (const key of Object.keys(schema.shape)) {
          //   if (schema.shape[key]?._def.typeName === "ZodBoolean") {
          //     values[key] = formData.get(key) === "" ? true : false;
          //     continue;
          //   }
          //
          //   values[key] = formData.get(key);
          // }

          console.log(schema);

          console.log(values);

          try {
            schema.parse(values);
          } catch (error) {
            const validationError = fromError(error);
            console.log(validationError);
          }
        }}
      />
    </div>
  );
}

export default App;
