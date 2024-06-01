import "./App.css";
import UmbracoForm from "./components/UmbracoForm";
import type { UmbracoFormDefinition } from "./components/umbraco-form.types";
import formData from "./form-data";

function App() {
  return (
    <div className="p-4">
      <UmbracoForm
        form={formData as UmbracoFormDefinition}
        renderPage={(props) => {
          return (
            <div className="space-y-4">
              <h2 className="text-3xl">{props.page.caption}</h2>
              {props.children}
            </div>
          );
        }}
        renderColumn={(props) => {
          return (
            <div className="space-y-4">
              <h4>{props.column.caption}</h4>
              {props.children}
            </div>
          );
        }}
        renderField={(props) => {
          return (
            <div className="flex flex-col">
              <label htmlFor={props.field.alias}>{props.field.caption}</label>
              {props.children}
            </div>
          );
        }}
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
