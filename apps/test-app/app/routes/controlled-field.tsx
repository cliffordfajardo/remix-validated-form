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
    myField: z.string(),
  })
);

export const action: ActionFunction = async ({ request }) => {
  const result = await validator.validate(await request.formData());
  if (result.error) return validationError(result.error);
  return { message: `Color chosen is ${result.data.myField}` };
};

const Controlled = () => {
  const { value, setValue } = useControlledField("myField");
  return (
    <div>
      <button type="button" onClick={() => setValue("blue")}>
        Blue {value === "blue" && "(selected)"}
      </button>
      <button type="button" onClick={() => setValue("green")}>
        Green {value === "green" && "(selected)"}
      </button>
      <button type="button" onClick={() => setValue("yellow")}>
        Yellow {value === "yellow" && "(selected)"}
      </button>
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
  const [max, setMax] = useState(0);
  const [min, setMin] = useState(0);
  return (
    <ValidatedForm
      validator={validator}
      method="post"
      defaultValues={{ myField: "green" }}
    >
      {data?.message && <div>{data.message}</div>}
      <div style={{ margin: "1rem" }}>
        <button type="button" onClick={() => setMax((prev) => prev + 1)}>
          +
        </button>
        <button type="button" onClick={() => setMin((prev) => prev + 1)}>
          -
        </button>
      </div>
      {[...range(min, max)].map((_, i) => (
        <Controlled key={i} />
      ))}
      <SubmitButton />
    </ValidatedForm>
  );
}
