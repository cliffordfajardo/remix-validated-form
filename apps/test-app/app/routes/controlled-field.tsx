import { withZod } from "@remix-validated-form/with-zod";
import { useState } from "react";
import { ActionFunction, useActionData } from "remix";
import {
  ValidatedForm,
  useControlledField,
  validationError,
} from "remix-validated-form";
import { z } from "zod";
import { SubmitButton } from "~/components/SubmitButton";

const validator = withZod(
  z.object({
    myField: z.literal("blue"),
    text: z.literal("bob"),
  })
);

export const action: ActionFunction = async ({ request }) => {
  const result = await validator.validate(await request.formData());
  if (result.error) return validationError(result.error);
  return { message: `Color chosen is ${result.data.myField}` };
};

const Controlled = () => {
  const { value, setValue, error, validate } = useControlledField("myField");
  const update = async (value: string) => {
    await setValue(value);
    validate();
  };
  return (
    <div>
      <button type="button" onClick={() => update("blue")} data-testid="blue">
        Blue{value === "blue" && " (selected)"}
      </button>
      <button type="button" onClick={() => update("green")} data-testid="green">
        Green{value === "green" && " (selected)"}
      </button>
      <button
        type="button"
        onClick={() => update("yellow")}
        data-testid="yellow"
      >
        Yellow{value === "yellow" && " (selected)"}
      </button>
      {error && (
        <p style={{ color: "red" }} data-testid="error">
          {error}
        </p>
      )}
    </div>
  );
};

const ControlledInput = () => {
  const { value, setValue, error, validate } =
    useControlledField<string>("text");
  const [count, setCount] = useState(0);

  const update = async (value: string) => {
    await setValue(value);
    validate();
    setCount((prev) => prev + 1);
  };

  return (
    <div>
      <input
        value={value}
        onChange={(e) => update(e.target.value)}
        data-testid="text-input"
      />
      {error && <p data-testid="text-error">{error}</p>}
      <p data-testid="resolution-count">{count}</p>
    </div>
  );
};

function* range(min: number, max: number) {
  for (let i = min; i < max; i++) {
    yield i;
  }
}

export default function ControlledField() {
  const data = useActionData();
  const [count, setCount] = useState(1);
  return (
    <ValidatedForm
      validator={validator}
      method="post"
      defaultValues={{ myField: "green" as any }}
    >
      {data?.message && <div>{data.message}</div>}
      <div style={{ margin: "1rem" }}>
        <button type="button" onClick={() => setCount((prev) => prev + 1)}>
          +
        </button>
        <button type="button" onClick={() => setCount((prev) => prev - 1)}>
          -
        </button>
      </div>
      {[...range(0, count)].map((_, i) => (
        <Controlled key={i} />
      ))}
      <ControlledInput />
      <SubmitButton />
    </ValidatedForm>
  );
}
