import "./App.css";
import UmbracoForm, { Field } from "./components/UmbracoForm";
import type { UmbracoFormDefinition } from "./components/umbraco-form.types";
import formData from "./form-data";

function App() {
  return (
    <div className="p-4">
      <UmbracoForm
        form={formData as UmbracoFormDefinition}
        renderPage={(props) => (
          <div className="space-y-4">
            <h2 className="text-3xl">{props.page.caption}</h2>
            {props.children}
          </div>
        )}
        renderColumn={(props) => (
          <div className="space-y-4">
            <h4>{props.column.caption}</h4>
            {props.children}
          </div>
        )}
        renderField={(props) => (
          <div className="flex flex-col space-y-2">
            <Field {...props} />
          </div>
        )}
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const formData = new FormData(form);
          console.log(Object.fromEntries(formData.entries()));
        }}
      />
    </div>
  );
}

export default App;
