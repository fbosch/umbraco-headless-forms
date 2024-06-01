import "./App.css";
import UmbracoForm from "./components/UmbracoForm";
import type { UmbracoFormDefinition } from "./components/umbraco-form.types";
import formData from "./form-data";

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
      />
    </div>
  );
}

export default App;
