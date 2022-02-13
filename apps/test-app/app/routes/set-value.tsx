import { withZod } from "@remix-validated-form/with-zod";
import { useState } from "react";
import { useField, useFormHelpers, ValidatedForm } from "remix-validated-form";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { Fieldset } from "~/components/Fieldset";
import { Input } from "~/components/Input";
import { Select } from "~/components/Select";
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
  const { setFieldValue } = useFormHelpers();
  return (
    <button
      type="button"
      onClick={() => {
        setFieldValue("textField", "new value");
        setFieldValue("controlled", "some value");
        setFieldValue("checkbox", true);
        setFieldValue("checkboxGroup", ["value2", "value1"]);
        setFieldValue("radioGroup", "value2");
        setFieldValue("weird", ["one", "two"]);
        setFieldValue("select", ["option1", "option3"]);
        // TODO: figure out how to deal with complex transformations like this
        // setFieldValue("complex", { year: 2021, month: 12, day: 13 });
      }}
    >
      Set values
    </button>
  );
};

const ComplexInput = () => {
  const { error, getInputProps } = useField("complex");
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
          data-testid="controlled"
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

export default function SetValues() {
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
      <Input name="textField" label="Text Field" data-testid="text-field" />
      <Input
        name="checkbox"
        label="A checkbox"
        type="checkbox"
        data-testid="single-checkbox"
      />
      <Select name="select" label="Select" data-testid="select" multiple>
        <option value="option1" data-testid="option1">
          Option 1
        </option>
        <option value="option2" data-testid="option2">
          Option 2
        </option>
        <option value="option3" data-testid="option3">
          Option 3
        </option>
      </Select>
      <Fieldset name="weird" label="Weird">
        <Input
          name="weird"
          label="Weird"
          type="checkbox"
          value="two"
          data-testid="weird-checkbox"
        />
        <Input
          name="weird"
          label="Weird"
          type="radio"
          value="one"
          data-testid="weird-radio-one"
        />
        <Input
          name="weird"
          label="Weird"
          type="radio"
          value="two"
          data-testid="weird-radio-two"
        />
        <Input name="weird" label="Weird" data-testid="weird-text" />
      </Fieldset>
      <ControlledInput />
      <ComplexInput />
      <Fieldset label="Checkbox group" name="checkboxGroup">
        <Input
          name="checkboxGroup"
          label="Value 1"
          value="value1"
          hideErrors
          type="checkbox"
          data-testid="checkbox-value1"
        />
        <Input
          name="checkboxGroup"
          label="Value 2"
          value="value2"
          hideErrors
          type="checkbox"
          data-testid="checkbox-value2"
        />
        <Input
          name="checkboxGroup"
          label="Value 3"
          value="value3"
          hideErrors
          type="checkbox"
          data-testid="checkbox-value3"
        />
      </Fieldset>
      <Fieldset label="Radio group" name="checkboxGroup">
        <Input
          name="radioGroup"
          label="Value 1"
          value="value1"
          hideErrors
          type="radio"
          data-testid="radio-value1"
        />
        <Input
          name="radioGroup"
          label="Value 2"
          value="value2"
          hideErrors
          type="radio"
          data-testid="radio-value2"
        />
        <Input
          name="radioGroup"
          label="Value 3"
          value="value3"
          hideErrors
          type="radio"
          data-testid="radio-value3"
        />
      </Fieldset>
      <SetValuesButton />
      <SubmitButton />
    </ValidatedForm>
  );
}
