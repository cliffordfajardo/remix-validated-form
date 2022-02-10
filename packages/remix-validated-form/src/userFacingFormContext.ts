import { useCallback } from "react";
import { useContextSelectAtom, useInternalFormContext } from "./internal/hooks";
import { registerReceiveFocusAtom } from "./internal/state";
import { FieldErrors, TouchedFields } from "./validation/types";
import { useFormHelpers, useFormState } from ".";

export type FormContextValue = {
  /**
   * All the errors in all the fields in the form.
   */
  fieldErrors: FieldErrors;
  /**
   * Clear the errors of the specified fields.
   */
  clearError: (...names: string[]) => void;
  /**
   * Validate the specified field.
   */
  validateField: (fieldName: string) => Promise<string | null>;
  /**
   * The `action` prop of the form.
   */
  action?: string;
  /**
   * Whether or not the form is submitting.
   */
  isSubmitting: boolean;
  /**
   * Whether or not a submission has been attempted.
   * This is true once the form has been submitted, even if there were validation errors.
   * Resets to false when the form is reset.
   */
  hasBeenSubmitted: boolean;
  /**
   * Whether or not the form is valid.
   */
  isValid: boolean;
  /**
   * The default values of the form.
   */
  defaultValues?: { [fieldName: string]: any };
  /**
   * Register a custom focus handler to be used when
   * the field needs to receive focus due to a validation error.
   */
  registerReceiveFocus: (fieldName: string, handler: () => void) => () => void;
  /**
   * Any fields that have been touched by the user.
   */
  touchedFields: TouchedFields;
  /**
   * Change the touched state of the specified field.
   */
  setFieldTouched: (fieldName: string, touched: boolean) => void;
};

/**
 * @deprecated in favor of `useFormState` and `useFormHelpers`
 *
 * Provides access to some of the internal state of the form.
 */
export const useFormContext = (formId?: string): FormContextValue => {
  // Try to access context so we get our error specific to this hook if it's not there
  const context = useInternalFormContext(formId, "useFormContext");
  const state = useFormState(formId);
  const {
    clearError: internalClearError,
    setTouched,
    validateField,
  } = useFormHelpers(formId);

  // const validateField = useContextSelectAtom(context.formId, validateFieldAtom);
  const registerReceiveFocus = useContextSelectAtom(
    context.formId,
    registerReceiveFocusAtom
  );

  const clearError = useCallback(
    (...names: string[]) => {
      names.forEach((name) => {
        internalClearError(name);
      });
    },
    [internalClearError]
  );

  return {
    ...state,
    setFieldTouched: setTouched,
    validateField,
    clearError,
    registerReceiveFocus,
  };
};
