import "./App.css";
import clsx from "clsx";
import UmbracoForm from "./components/UmbracoForm";
import formDefinition from "./form-definition";
import { FormDto } from "./components/types";

const form = formDefinition as unknown as FormDto;

function App() {
  return (
    <div className="p-4">
      <UmbracoForm
        form={form}
        config={{ shouldValidate: true }}
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
          console.log("submit", e.target);
        }}
      />
    </div>
  );
}

export default App;
