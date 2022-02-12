import { atom, PrimitiveAtom } from "jotai";
import { atomFamily, useAtomCallback } from "jotai/utils";
import { useCallback, useEffect, useState } from "react";
import { useFormAtom, useFormAtomValue, useFormUpdateAtom } from "../hooks";
import { ATOM_SCOPE, formPropsAtom } from "../state";
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

export const useAllControlledFields = (formId: InternalFormId) =>
  useFormAtomValue(controlledFieldsAtom(formId));

export const useControllableValue = (formId: InternalFormId, field: string) => {
  const [internalFieldId] = useState(() => Symbol(`field-${field}`));
  const fieldAtom = fieldValueAtom(internalFieldId);
  const [value, setValue] = useFormAtom(fieldAtom);

  const register = useFormUpdateAtom(registerAtom);
  const unregister = useFormUpdateAtom(unregisterAtom);

  useEffect(() => {
    register({ formId, internalFieldId, name: field });
    return () => unregister({ formId, internalFieldId, name: field });
  }, [field, formId, internalFieldId, register, unregister]);

  const { validateField } = useFormAtomValue(formPropsAtom(formId));

  const setValueAsync = useAtomCallback(
    useCallback(
      async (_, set, update: unknown) => {
        setValue(update);
        const pending = pendingValidateAtom(internalFieldId);
        await new Promise<void>((resolve) => set(pending, resolve));
        set(pending, undefined);
      },
      [internalFieldId, setValue]
    ),
    ATOM_SCOPE
  );

  return [value, setValueAsync] as const;
};

export const useSignalUpdateComplete = (internalFieldId: symbol) => {
  const pending = useFormAtomValue(pendingValidateAtom(internalFieldId));

  useEffect(() => {
    pending?.();
  }, [pending]);
};
