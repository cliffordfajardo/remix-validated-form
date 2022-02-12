import { atom, PrimitiveAtom } from "jotai";
import { atomFamily } from "jotai/utils";
import { useCallback, useEffect, useState } from "react";
import { useFormAtomValue, useFormUpdateAtom } from "../hooks";
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

export const useSetControlledFieldValue = () =>
  useFormUpdateAtom(setControlledFieldValueAtom);

export const useAllControlledFields = (formId: InternalFormId) =>
  useFormAtomValue(controlledFieldsAtom(formId));

export const useControllableValue = (formId: InternalFormId, field: string) => {
  const [internalFieldId] = useState(() => Symbol(`field-${field}`));
  const fieldAtom = fieldValueAtom(internalFieldId);
  const value = useFormAtomValue(fieldAtom);
  const setControlledFieldValue = useSetControlledFieldValue();

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
