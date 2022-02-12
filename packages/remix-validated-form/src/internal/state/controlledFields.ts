import { atom, PrimitiveAtom } from "jotai";
import { atomFamily, useAtomCallback } from "jotai/utils";
import { useCallback, useEffect, useState } from "react";
import invariant from "tiny-invariant";
import { useFormAtomValue, useFormUpdateAtom } from "../hooks";
import { setInputValueInForm } from "../logic/setInputValueInForm";
import { ATOM_SCOPE, formElementAtom } from "../state";
import { formAtomFamily, InternalFormId } from "./atomUtils";

type ControlledFieldState = {
  valueAtom: PrimitiveAtom<unknown>;
  name: string;
  internalId: symbol;
};
const controlledFieldsAtom = formAtomFamily<ControlledFieldState[]>([]);
const fieldValueAtom = atomFamily((internalId: symbol) =>
  atom<unknown>(undefined)
);
const pendingValidateAtom = atomFamily((internalId: symbol) =>
  atom<(() => void) | undefined>(undefined)
);

type ControlledFieldRegistration = {
  formId: InternalFormId;
  internalFieldId: symbol;
  name: string;
};

const registerAtom = atom(
  null,
  (
    get,
    set,
    { formId, internalFieldId, name }: ControlledFieldRegistration
  ) => {
    set(controlledFieldsAtom(formId), (prev) => [
      ...prev,
      {
        valueAtom: fieldValueAtom(internalFieldId),
        name,
        internalId: internalFieldId,
      },
    ]);
  }
);

const unregisterAtom = atom(
  null,
  (get, set, { formId, internalFieldId }: ControlledFieldRegistration) => {
    set(controlledFieldsAtom(formId), (prev) =>
      prev.filter(({ internalId }) => internalId !== internalFieldId)
    );
    fieldValueAtom.remove(internalFieldId);
  }
);

const setControlledFieldValueAtom = atom(
  null,
  async (
    _get,
    set,
    { internalFieldId, value }: { internalFieldId: symbol; value: unknown }
  ) => {
    set(fieldValueAtom(internalFieldId), value);
    const pending = pendingValidateAtom(internalFieldId);
    await new Promise<void>((resolve) => set(pending, resolve));
    set(pending, undefined);
  }
);

export const useSetFieldValue = (formId: InternalFormId) =>
  useAtomCallback(
    async (get, set, { field, value }: { field: string; value: unknown }) => {
      const controlledFields = get(controlledFieldsAtom(formId));
      const relevantFields = controlledFields.filter(
        ({ name }) => name === field
      );

      if (relevantFields.length === 0) {
        const form = get(formElementAtom(formId));
        invariant(
          form,
          "Unable to access form element when setting field value. This is likely a bug in remix-validated-form."
        );
        setInputValueInForm(form, field, value);
        return;
      }

      if (relevantFields.length === 1) {
        await set(setControlledFieldValueAtom, {
          internalFieldId: relevantFields[0].internalId,
          value,
        });
        return;
      }

      if (relevantFields.length > 1) {
        invariant(
          Array.isArray(value),
          `Multiple instances of controlled field ${field} are present but was given a single value.` +
            "Please supply an array of values instead."
        );
        for (const [index, field] of relevantFields.entries()) {
          const itemValue = value[index] ?? "";
          await set(setControlledFieldValueAtom, {
            internalFieldId: field.internalId,
            value: itemValue,
          });
        }
      }
    },
    ATOM_SCOPE
  );

export const useAllControlledFields = (formId: InternalFormId) =>
  useFormAtomValue(controlledFieldsAtom(formId));

export const useControllableValue = (formId: InternalFormId, field: string) => {
  const [internalFieldId] = useState(() => Symbol(`field-${field}`));
  const fieldAtom = fieldValueAtom(internalFieldId);
  const value = useFormAtomValue(fieldAtom);
  const setControlledFieldValue = useFormUpdateAtom(
    setControlledFieldValueAtom
  );

  const register = useFormUpdateAtom(registerAtom);
  const unregister = useFormUpdateAtom(unregisterAtom);

  useEffect(() => {
    register({ formId, internalFieldId, name: field });
    return () => unregister({ formId, internalFieldId, name: field });
  }, [field, formId, internalFieldId, register, unregister]);

  const setValue = useCallback(
    (value: unknown) => setControlledFieldValue({ internalFieldId, value }),
    [internalFieldId, setControlledFieldValue]
  );

  return [value, setValue] as const;
};

export const useSignalUpdateComplete = (internalFieldId: symbol) => {
  const pending = useFormAtomValue(pendingValidateAtom(internalFieldId));

  useEffect(() => {
    pending?.();
  }, [pending]);
};
