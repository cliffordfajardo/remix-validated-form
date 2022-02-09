import { useActionData, useMatches, useTransition } from "@remix-run/react";
import { Atom } from "jotai";
import { useAtomValue, useUpdateAtom } from "jotai/utils";
import lodashGet from "lodash/get";
import { useCallback, useContext, useMemo } from "react";
import invariant from "tiny-invariant";
import { FieldErrors, ValidationErrorResponseData } from "..";
import { formDefaultValuesKey } from "./constants";
import { InternalFormContext, InternalFormContextValue } from "./formContext";
import { Hydratable, hydratable } from "./hydratable";
import {
  ATOM_SCOPE,
  clearErrorAtom,
  fieldDefaultValueAtom,
  fieldErrorAtom,
  fieldTouchedAtom,
  FormAtom,
  formRegistry,
  isHydratedAtom,
  setTouchedAtom,
} from "./state";

type FormSelectorAtomCreator<T> = (formState: FormAtom) => Atom<T>;

export const useInternalFormContext = (
  formId?: string | symbol,
  hookName?: string
) => {
  const formContext = useContext(InternalFormContext);

  if (formId) return { formId };
  if (formContext) return formContext;

  throw new Error(
    `Unable to determine form for ${hookName}. Please use it inside a form or pass a 'formId'.`
  );
};

export const useContextSelectAtom = <T>(
  formId: string | symbol,
  selectorAtomCreator: FormSelectorAtomCreator<T>
) => {
  const formAtom = formRegistry(formId);
  const selectorAtom = useMemo(
    () => selectorAtomCreator(formAtom),
    [formAtom, selectorAtomCreator]
  );
  return useAtomValue(selectorAtom, ATOM_SCOPE);
};

export function useErrorResponseForForm({
  fetcher,
  subaction,
  formId,
}: InternalFormContextValue): ValidationErrorResponseData | null {
  const actionData = useActionData<any>();
  if (fetcher) {
    if ((fetcher.data as any)?.fieldErrors) return fetcher.data as any;
    return null;
  }

  if (!actionData?.fieldErrors) return null;

  // If there's an explicit id, we should ignore data that has the wrong id
  if (typeof formId === "string" && actionData.formId)
    return actionData.formId === formId ? actionData : null;

  if (
    (!subaction && !actionData.subaction) ||
    actionData.subaction === subaction
  )
    return actionData;

  return null;
}

export const useFieldErrorsForForm = (
  context: InternalFormContextValue
): Hydratable<FieldErrors | undefined> => {
  const response = useErrorResponseForForm(context);
  const hydrated = useContextSelectAtom(context.formId, isHydratedAtom);
  return hydratable.from(response?.fieldErrors, hydrated);
};

export const useDefaultValuesFromLoader = ({
  formId,
}: InternalFormContextValue) => {
  const matches = useMatches();
  if (typeof formId === "string") {
    const dataKey = formDefaultValuesKey(formId);
    // If multiple loaders declare the same default values,
    // we should use the data from the deepest route.
    const match = matches
      .reverse()
      .find((match) => match.data && dataKey in match.data);
    return match?.data[dataKey];
  }

  return null;
};

export const useDefaultValuesForForm = (
  context: InternalFormContextValue
): Hydratable<{ [fieldName: string]: any }> => {
  const { formId, defaultValuesProp } = context;
  const hydrated = useContextSelectAtom(formId, isHydratedAtom);
  const errorResponse = useErrorResponseForForm(context);
  const defaultValuesFromLoader = useDefaultValuesFromLoader(context);

  // Typical flow is:
  // - Default values only available from props or server
  //   - Props have a higher priority than server
  // - State gets hydrated with default values
  // - After submit, we may need to use values from the error

  if (hydrated) return hydratable.hydratedData();
  if (errorResponse?.repopulateFields) {
    invariant(
      typeof errorResponse.repopulateFields === "object",
      "repopulateFields returned something other than an object"
    );
    return hydratable.serverData(errorResponse.repopulateFields);
  }
  if (defaultValuesProp) return hydratable.serverData(defaultValuesProp);

  return hydratable.serverData(defaultValuesFromLoader);
};

export const useHasActiveFormSubmit = ({
  fetcher,
}: InternalFormContextValue): boolean => {
  const transition = useTransition();
  const hasActiveSubmission = fetcher
    ? fetcher.state === "submitting"
    : !!transition.submission;
  return hasActiveSubmission;
};

export const useFieldTouched = (
  name: string,
  { formId }: InternalFormContextValue
) => {
  const atomCreator = useMemo(() => fieldTouchedAtom(name), [name]);
  return useContextSelectAtom(formId, atomCreator);
};

export const useFieldError = (
  name: string,
  context: InternalFormContextValue
) => {
  const fieldErrors = useFieldErrorsForForm(context);
  const atomCreator = useMemo(() => fieldErrorAtom(name), [name]);
  const state = useContextSelectAtom(context.formId, atomCreator);
  return fieldErrors.map((fieldErrors) => fieldErrors?.[name]).hydrateTo(state);
};

export const useFieldDefaultValue = (
  name: string,
  context: InternalFormContextValue
) => {
  const defaultValues = useDefaultValuesForForm(context);
  const atomCreator = useMemo(() => fieldDefaultValueAtom(name), [name]);
  const state = useContextSelectAtom(context.formId, atomCreator);
  return defaultValues.map((val) => lodashGet(val, name)).hydrateTo(state);
};

export const useFormUpdateAtom: typeof useUpdateAtom = (atom) =>
  useUpdateAtom(atom, ATOM_SCOPE);

export const useClearError = (context: InternalFormContextValue) => {
  const clearError = useFormUpdateAtom(clearErrorAtom);
  return useCallback(
    (name: string) => {
      clearError({ name, formAtom: formRegistry(context.formId) });
    },
    [clearError, context.formId]
  );
};

export const useSetTouched = (context: InternalFormContextValue) => {
  const setTouched = useFormUpdateAtom(setTouchedAtom);
  return useCallback(
    (name: string, touched: boolean) => {
      setTouched({ name, formAtom: formRegistry(context.formId), touched });
    },
    [setTouched, context.formId]
  );
};
