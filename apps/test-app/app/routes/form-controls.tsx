import { withZod } from "@remix-validated-form/with-zod";
import { useState } from "react";
import { ActionFunction, useActionData } from "remix";
import { validationError, ValidatedForm, useField } from "remix-validated-form";
import { z } from "zod";
import { SubmitButton } from "~/components/SubmitButton";

const validator = withZod(z.object({}).passthrough());

const Select = () => {
  const { error, getInputProps } = useField("selectField");
  return (
    <>
      <label>
        Select
        <select
          {...getInputProps({
            multiple: true,
          })}
        >
          <option value="value1">Value 1</option>
          <option>Value 2</option>
        </select>
        {error && <p>{error}</p>}
      </label>
    </>
  );
};

export const action: ActionFunction = async ({ request }) => {
  const result = await validator.validate(await request.formData());
  if (result.error) return validationError(result.error, result.submittedData);

  return { message: "Submitted!" };
};

export default function FrontendValidation() {
  const actionData = useActionData();
  const [result, setResult] = useState("");
  return (
    <ValidatedForm
      validator={validator}
      method="post"
      id="test-form"
      onSubmit={(data, event) => {
        event.preventDefault();
        setResult(JSON.stringify(data));
      }}
    >
      {actionData && <h1>{actionData.message}</h1>}
      <pre>{result}</pre>
      <Select />
      <Select />
      <input name="selectField" />
      <SubmitButton />
    </ValidatedForm>
  );
}
