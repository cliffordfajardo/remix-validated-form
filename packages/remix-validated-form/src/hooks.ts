import { useEffect, useMemo } from "react";
import {
  createGetInputProps,
  GetInputProps,
  ValidationBehaviorOptions,
} from "./internal/getInputProps";
import {
  useInternalFormContext,
  useFieldTouched,
  useFieldError,
  useFieldDefaultValue,
  useContextSelectAtom,
  useClearError,
  useSetTouched,
  useDefaultValuesForForm,
  useFieldErrorsForForm,
  simpleHydratable,
} from "./internal/hooks";
import {
  FormState,
  formStateAtom,
  hasBeenSubmittedAtom,
  isSubmittingAtom,
  isValidAtom,
  registerReceiveFocusAtom,
  validateFieldAtom,
} from "./internal/state";

/**
 * Returns whether or not the parent form is currently being submitted.
 * This is different from remix's `useTransition().submission` in that it
 * is aware of what form it's in and when _that_ form is being submitted.
 *
 * @param formId
 */
export const useIsSubmitting = (formId?: string) => {
  const formContext = useInternalFormContext(formId, "useIsSubmitting");
  return useContextSelectAtom(formContext.formId, isSubmittingAtom);
};

/**
 * Returns whether or not the current form is valid.
 *
 * @param formId the id of the form. Only necessary if being used outside a ValidatedForm.
 */
export const useIsValid = (formId?: string) => {
  const formContext = useInternalFormContext(formId, "useIsValid");
  return useContextSelectAtom(formContext.formId, isValidAtom);
};

/**
 * Returns information about the form.
 *
 * @param formId the id of the form. Only necessary if being used outside a ValidatedForm.
 */
export const useFormState = (formId?: string): FormState => {
  const formContext = useInternalFormContext(formId, "useIsValid");
  const formState = useContextSelectAtom(formContext.formId, formStateAtom);
  const defaultValuesToUse = useDefaultValuesForForm(formContext);
  const fieldErrorsToUse = useFieldErrorsForForm(formContext);

  const defaultValues = simpleHydratable(
    defaultValuesToUse,
    formState.defaultValues
  );
  const fieldErrors = simpleHydratable(fieldErrorsToUse, formState.fieldErrors);

  return useMemo(
    () => ({ ...formState, defaultValues, fieldErrors: fieldErrors ?? {} }),
    [defaultValues, fieldErrors, formState]
  );
};

export type FormHelpers = {
  /**
   * Clear the error of the specified field.
   */
  clearError: (fieldName: string) => void;
  /**
   * Validate the specified field.
   */
  validateField: (fieldName: string) => Promise<string | null>;
  /**
   * Change the touched state of the specified field.
   */
  setTouched: (fieldName: string, touched: boolean) => void;
};

/**
 * Returns helpers that can be used to update the form state.
 *
 * @param formId the id of the form. Only necessary if being used outside a ValidatedForm.
 */
export const useFormHelpers = (formId?: string) => {
  const formContext = useInternalFormContext(formId, "useFormHelpers");
  const setTouched = useSetTouched(formContext);
  const validateField = useContextSelectAtom(
    formContext.formId,
    validateFieldAtom
  );
  const clearError = useClearError(formContext);
  return useMemo(
    () => ({
      setTouched,
      validateField,
      clearError,
    }),
    [clearError, setTouched, validateField]
  );
};

export type FieldProps = {
  /**
   * The validation error message if there is one.
   */
  error?: string;
  /**
   * Clears the error message.
   */
  clearError: () => void;
  /**
   * Validates the field.
   */
  validate: () => void;
  /**
   * The default value of the field, if there is one.
   */
  defaultValue?: any;
  /**
   * Whether or not the field has been touched.
   */
  touched: boolean;
  /**
   * Helper to set the touched state of the field.
   */
  setTouched: (touched: boolean) => void;
  /**
   * Helper to get all the props necessary for a regular input.
   */
  getInputProps: GetInputProps;
};

/**
 * Provides the data and helpers necessary to set up a field.
 */
export const useField = (
  name: string,
  options?: {
    /**
     * Allows you to configure a custom function that will be called
     * when the input needs to receive focus due to a validation error.
     * This is useful for custom components that use a hidden input.
     */
    handleReceiveFocus?: () => void;
    /**
     * Allows you to specify when a field gets validated (when using getInputProps)
     */
    validationBehavior?: Partial<ValidationBehaviorOptions>;
    /**
     * The formId of the form you want to use.
     * This is not necesary if the input is used inside a form.
     */
    formId?: string;
  }
): FieldProps => {
  const { handleReceiveFocus, formId: providedFormId } = options ?? {};
  const formContext = useInternalFormContext(providedFormId, "useField");

  const defaultValue = useFieldDefaultValue(name, formContext);
  const touched = useFieldTouched(name, formContext);
  const error = useFieldError(name, formContext);

  const clearError = useClearError(formContext);
  const setTouched = useSetTouched(formContext);
  const hasBeenSubmitted = useContextSelectAtom(
    formContext.formId,
    hasBeenSubmittedAtom
  );
  const validateField = useContextSelectAtom(
    formContext.formId,
    validateFieldAtom
  );
  const registerReceiveFocus = useContextSelectAtom(
    formContext.formId,
    registerReceiveFocusAtom
  );

  useEffect(() => {
    if (handleReceiveFocus)
      return registerReceiveFocus(name, handleReceiveFocus);
  }, [handleReceiveFocus, name, registerReceiveFocus]);

  const field = useMemo<FieldProps>(() => {
    const helpers = {
      error,
      clearError: () => clearError(name),
      validate: () => {
        validateField(name);
      },
      defaultValue,
      touched,
      setTouched: (touched: boolean) => setTouched(name, touched),
    };
    const getInputProps = createGetInputProps({
      ...helpers,
      name,
      hasBeenSubmitted,
      validationBehavior: options?.validationBehavior,
    });
    return {
      ...helpers,
      getInputProps,
    };
  }, [
    error,
    defaultValue,
    touched,
    name,
    hasBeenSubmitted,
    options?.validationBehavior,
    clearError,
    validateField,
    setTouched,
  ]);

  return field;
};
