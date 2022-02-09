import { useActionData, useMatches, useTransition } from "@remix-run/react";
import { Atom } from "jotai";
import { useAtomValue, useUpdateAtom } from "jotai/utils";
import lodashGet from "lodash/get";
import { useCallback, useContext, useMemo } from "react";
import { ValidationErrorResponseData } from "..";
import { formDefaultValuesKey } from "./constants";
import { InternalFormContext, InternalFormContextValue } from "./formContext";
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
const USE_HYDRATED_STATE = Symbol("USE_HYDRATED_STATE");

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

export const simpleHydratable = <T>(
  val: T | typeof USE_HYDRATED_STATE,
  backup: T
) => (val === USE_HYDRATED_STATE ? backup : val);

export const useHydratableSelector = <T, U>(
  { formId }: InternalFormContextValue,
  atomCreator: FormSelectorAtomCreator<T>,
  dataToUse: U | typeof USE_HYDRATED_STATE,
  selector: (data: U) => T
) => {
  const dataFromState = useContextSelectAtom(formId, atomCreator);
  return dataToUse === USE_HYDRATED_STATE ? dataFromState : selector(dataToUse);
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

export const useFieldErrorsForForm = (context: InternalFormContextValue) => {
  const response = useErrorResponseForForm(context);
  const hydrated = useContextSelectAtom(context.formId, isHydratedAtom);
  return hydrated ? USE_HYDRATED_STATE : response?.fieldErrors;
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

export const useDefaultValuesForForm = (context: InternalFormContextValue) => {
  const { formId, defaultValuesProp } = context;
  const hydrated = useContextSelectAtom(formId, isHydratedAtom);
  const errorResponse = useErrorResponseForForm(context);
  const defaultValuesFromLoader = useDefaultValuesFromLoader(context);

  // Typical flow is:
  // - Default values only available from props or server
  //   - Props have a higher priority than server
  // - State gets hydrated with default values
  // - After submit, we may need to use values from the error

  if (hydrated) return USE_HYDRATED_STATE;
  if (errorResponse?.repopulateFields) return errorResponse.repopulateFields;
  if (defaultValuesProp) return defaultValuesProp;
  return defaultValuesFromLoader;
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
  return useHydratableSelector(
    context,
    useMemo(() => fieldErrorAtom(name), [name]),
    useFieldErrorsForForm(context),
    (fieldErrors) => fieldErrors?.[name]
  );
};

export const useFieldDefaultValue = (
  name: string,
  context: InternalFormContextValue
) => {
  return useHydratableSelector(
    context,
    useMemo(() => fieldDefaultValueAtom(name), [name]),
    useDefaultValuesForForm(context),
    (val) => lodashGet(val, name)
  );
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
