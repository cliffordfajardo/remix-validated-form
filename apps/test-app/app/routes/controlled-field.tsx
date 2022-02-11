import { withZod } from "@remix-validated-form/with-zod";
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
    <>
      <button type="button" onClick={() => setValue("blue")}>
        Blue {value === "blue" && "(selected)"}
      </button>
      <button type="button" onClick={() => setValue("green")}>
        Green {value === "green" && "(selected)"}
      </button>
      <button type="button" onClick={() => setValue("yellow")}>
        Yellow {value === "yellow" && "(selected)"}
      </button>
    </>
  );
};

export default function ControlledField() {
  const data = useActionData();
  return (
    <ValidatedForm
      validator={validator}
      method="post"
      defaultValues={{ myField: "green" }}
    >
      {data?.message && <div>{data.message}</div>}
      <Controlled />
      <div>
        <SubmitButton />
      </div>
    </ValidatedForm>
  );
}
