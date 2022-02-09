import { withZod } from "@remix-validated-form/with-zod";
import { useState } from "react";
import { useField, useFormContext, ValidatedForm } from "remix-validated-form";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { Fieldset } from "~/components/Fieldset";
import { Input } from "~/components/Input";
import { SubmitButton } from "~/components/SubmitButton";

const validator = withZod(
  z.object({
    textField: zfd.text(),
    controlled: zfd.text(),
    checkboxGroup: zfd.repeatable(),
    radioGroup: z.union([z.literal("value1"), z.literal("value2")]),
    checkbox: zfd.checkbox(),
    complex: zfd
      .text(z.string().regex(/\d{4}-\d{2}-\d{2}/))
      .transform((value) => {
        const [year, month, day] = value.split("-");
        return {
          year: Number(year),
          month: Number(month),
          day: Number(day),
        };
      }),
  })
);

const SetValuesButton = () => {
  const { setFieldValue } = useFormContext();
  return (
    <button
      type="button"
      onClick={() => {
        const form = document.getElementById("test-form") as HTMLFormElement;
        setFieldValue(form, "textField", "new value");
        setFieldValue(form, "controlled", "some value");
        setFieldValue(form, "checkbox", true);
        setFieldValue(form, "checkboxGroup", ["value1", "value2"]);
        setFieldValue(form, "radioGroup", "value2");
        setFieldValue(form, "complex", { year: 2021, month: 12, day: 13 });
      }}
    >
      Set values
    </button>
  );
};

const ComplexInput = () => {
  const { error, getInputProps } = useField("complex", {
    // formatValue: (value) =>
    //   value && `${value.year}-${value.month}-${value.day}`,
  });
  return (
    <div>
      <label htmlFor="complex">Complex</label>
      <input id="complex" {...getInputProps({ type: "date" })} />
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

const ControlledInput = () => {
  const [value, setVal] = useState("");
  const { error, getInputProps } = useField("controlled");
  return (
    <div>
      <div style={{ display: "flex" }}>
        <label htmlFor="controlled">Controlled</label>
        <input
          id="controlled"
          {...getInputProps({
            onChange: (e) => {
              console.log(e);
              setVal(e.target.value);
            },
            value,
          })}
        />
        <strong> Value: </strong>
        {value}
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default function DefaultValues() {
  return (
    <ValidatedForm
      validator={validator}
      method="post"
      onChange={() => console.log("changed")}
      defaultValues={{
        complex: {
          year: 2020,
          month: 11,
          day: 11,
        },
      }}
      id="test-form"
    >
      <Input name="textField" label="Text Field" />
      <Input name="checkbox" label="A checkbox" type="checkbox" />
      <ControlledInput />
      <ComplexInput />
      <Fieldset label="Checkbox group" name="checkboxGroup">
        <Input
          name="checkboxGroup"
          label="Value 1"
          value="value1"
          hideErrors
          type="checkbox"
        />
        <Input
          name="checkboxGroup"
          label="Value 2"
          value="value2"
          hideErrors
          type="checkbox"
        />
        <Input
          name="checkboxGroup"
          label="Value 3"
          value="value3"
          hideErrors
          type="checkbox"
        />
      </Fieldset>
      <Fieldset label="Radio group" name="checkboxGroup">
        <Input
          name="radioGroup"
          label="Value 1"
          value="value1"
          hideErrors
          type="radio"
        />
        <Input
          name="radioGroup"
          label="Value 2"
          value="value2"
          hideErrors
          type="radio"
        />
        <Input
          name="radioGroup"
          label="Value 3"
          value="value3"
          hideErrors
          type="radio"
        />
      </Fieldset>
      <SetValuesButton />
      <SubmitButton />
    </ValidatedForm>
  );
}
