import "./App.css";
import UmbracoForm from "./components/UmbracoForm";
import formDefinition from "./form-definition";
import { FormDto } from "./components/types";

const form = formDefinition as unknown as FormDto;

function App() {
  return (
    <div className="p-4">
      <UmbracoForm
        form={form}
        config={{ validation: { enabled: true } }}
        renderPage={(props) => (
          <div className="space-y-4">
            <UmbracoForm.Page {...props} />
          </div>
        )}
        renderColumn={(props) => (
          <div className="space-y-6">
            <UmbracoForm.Column {...props} />
          </div>
        )}
        renderField={(props) => (
          <div className="flex flex-col space-y-2">
            <UmbracoForm.Field {...props} />
          </div>
        )}
        renderInput={(props) => (
          <UmbracoForm.Input
            {...props}
            className="aria-invalid:border-red-500 rounded"
          />
        )}
        onSubmit={(e) => {
          e.preventDefault();
          console.log("submit", e.target);
        }}
      />
    </div>
  );
}

export default App;
