import { atom, PrimitiveAtom } from "jotai";
import omit from "lodash/omit";
import { useEffect } from "react";
import { useFormAtom, useFormAtomValue, useFormUpdateAtom } from "../hooks";
import {
  fieldAtomFamily,
  formAtomFamily,
  InternalFormId,
  FieldAtomKey,
} from "./atomUtils";

const controlledFieldsAtom = formAtomFamily<{
  [fieldName: string]: PrimitiveAtom<unknown>;
}>({});
const fieldValueAtom = fieldAtomFamily(() => atom<unknown>(undefined));
const refCountAtom = fieldAtomFamily(() => atom(0));

const registerAtom = atom(null, (get, set, { formId, field }: FieldAtomKey) => {
  const prevRefCount = get(refCountAtom({ formId, field }));
  set(refCountAtom({ formId, field }), (prev) => prev + 1);
  if (prevRefCount === 0) {
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
    const newRefCount = get(refCountAtom({ formId, field }));
    if (newRefCount === 0) {
      set(controlledFieldsAtom(formId), (prev) => omit(prev, field));
      fieldValueAtom.remove({ formId, field });
    }
  }
);

export const useAllControlledFields = (formId: InternalFormId) =>
  useFormAtomValue(controlledFieldsAtom(formId));

export const useFieldValue = (formId: InternalFormId, field: string) => {
  const fieldAtom = fieldValueAtom({ formId, field });
  const result = useFormAtom(fieldAtom);

  const register = useFormUpdateAtom(registerAtom);
  const unregister = useFormUpdateAtom(unregisterAtom);

  useEffect(() => {
    register({ formId, field });
    return () => unregister({ formId, field });
  }, [field, formId, register, unregister]);

  return result;
};
