import { atom, PrimitiveAtom } from "jotai";
import { atomFamily, useAtomCallback } from "jotai/utils";
import omit from "lodash/omit";
import { useCallback, useEffect } from "react";
import invariant from "tiny-invariant";
import { useFormAtomValue, useFormUpdateAtom } from "../hooks";
import { setInputValueInForm } from "../logic/setInputValueInForm";
import { ATOM_SCOPE, formElementAtom } from "../state";
import {
  fieldAtomFamily,
  FieldAtomKey,
  formAtomFamily,
  InternalFormId,
} from "./atomUtils";

const controlledFieldsAtom = formAtomFamily<
  Record<string, PrimitiveAtom<unknown>>
>({});
const fieldValueAtom = fieldAtomFamily(() => atom<unknown>(undefined));
const pendingValidateAtom = fieldAtomFamily(() =>
  atom<(() => void) | undefined>(undefined)
);
const refCountAtom = fieldAtomFamily(() => atom(0));

const registerAtom = atom(null, (get, set, { formId, field }: FieldAtomKey) => {
  set(refCountAtom({ formId, field }), (prev) => prev + 1);
  const refCount = get(refCountAtom({ formId, field }));

  if (refCount === 1) {
    set(controlledFieldsAtom(formId), (prev) => ({
      ...prev,
      [field]: fieldValueAtom({ formId, field }),
    }));
  }
});

const unregisterAtom = atom(
  null,
  (get, set, { formId, field }: FieldAtomKey) => {
    set(refCountAtom({ formId, field }), (prev) => prev - 1);
    const refCount = get(refCountAtom({ formId, field }));
    if (refCount === 0) {
      set(controlledFieldsAtom(formId), (prev) => omit(prev, field));
      fieldValueAtom.remove({ formId, field });
    }
  }
);

const setControlledFieldValueAtom = atomFamily((formId: InternalFormId) =>
  atom(
    null,
    async (_get, set, { field, value }: { field: string; value: unknown }) => {
      set(fieldValueAtom({ formId, field }), value);
      const pending = pendingValidateAtom({ formId, field });
      await new Promise<void>((resolve) => set(pending, resolve));
      set(pending, undefined);
    }
  )
);

export const useSetFieldValue = (formId: InternalFormId) => {
  return useAtomCallback(
    async (get, set, { field, value }: { field: string; value: unknown }) => {
      const controlledFields = get(controlledFieldsAtom(formId));
      const fieldAtom = controlledFields[field];

      if (fieldAtom) set(fieldAtom, value);
      else {
        const form = get(formElementAtom(formId));
        invariant(
          form,
          "Unable to access form element when setting field value. This is likely a bug in remix-validated-form."
        );
        setInputValueInForm(form, field, value);
        return;
      }
    },
    ATOM_SCOPE
  );
};

export const useAllControlledFields = (formId: InternalFormId) =>
  useFormAtomValue(controlledFieldsAtom(formId));

export const useControllableValue = (formId: InternalFormId, field: string) => {
  const fieldAtom = fieldValueAtom({ formId, field });
  const value = useFormAtomValue(fieldAtom);
  const setControlledFieldValue = useFormUpdateAtom(
    setControlledFieldValueAtom(formId)
  );

  const register = useFormUpdateAtom(registerAtom);
  const unregister = useFormUpdateAtom(unregisterAtom);

  useEffect(() => {
    register({ formId, field });
    return () => unregister({ formId, field });
  }, [field, formId, register, unregister]);

  const setValue = useCallback(
    (value: unknown) => setControlledFieldValue({ field, value }),
    [field, setControlledFieldValue]
  );

  return [value, setValue] as const;
};

export const useSignalUpdateComplete = (
  formId: InternalFormId,
  field: string
) => {
  const pending = useFormAtomValue(pendingValidateAtom({ formId, field }));

  useEffect(() => {
    pending?.();
  }, [pending]);
};
