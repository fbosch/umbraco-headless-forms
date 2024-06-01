import "./App.css";
import UmbracoForm from "./components/UmbracoForm";
import type { UmbracoFormDefinition } from "./components/umbraco-form.types";
import formData from "./form-data";

function App() {
  return (
    <div className="p-4">
      <UmbracoForm
        form={formData as UmbracoFormDefinition}
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const formData = new FormData(form);
          console.log(formData);
        }}
      />
    </div>
  );
}

export default App;
