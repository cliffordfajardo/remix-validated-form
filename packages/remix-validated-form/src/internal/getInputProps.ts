import omitBy from "lodash/omitBy";
import { getCheckboxChecked } from "./logic/getCheckboxChecked";
import { getRadioChecked } from "./logic/getRadioChecked";

export type ValidationBehavior = "onBlur" | "onChange" | "onSubmit";

export type ValidationBehaviorOptions = {
  initial: ValidationBehavior;
  whenTouched: ValidationBehavior;
  whenSubmitted: ValidationBehavior;
};

export type CreateGetInputPropsOptions = {
  clearError: () => void;
  validate: () => void;
  defaultValue?: any;
  touched: boolean;
  setTouched: (touched: boolean) => void;
  hasBeenSubmitted: boolean;
  validationBehavior?: Partial<ValidationBehaviorOptions>;
  name: string;
};

type HandledProps = "name" | "defaultValue" | "defaultChecked";
type Callbacks = "onChange" | "onBlur";

type MinimalInputProps = {
  onChange?: (...args: any[]) => void;
  onBlur?: (...args: any[]) => void;
  defaultValue?: any;
  defaultChecked?: boolean;
  name?: string;
  type?: string;
};

export type GetInputProps = <T extends MinimalInputProps>(
  props?: Omit<T, HandledProps | Callbacks> & Partial<Pick<T, Callbacks>>
) => T;

const defaultValidationBehavior: ValidationBehaviorOptions = {
  initial: "onBlur",
  whenTouched: "onChange",
  whenSubmitted: "onChange",
};

export const createGetInputProps = ({
  clearError,
  validate,
  defaultValue,
  touched,
  setTouched,
  hasBeenSubmitted,
  validationBehavior,
  name,
}: CreateGetInputPropsOptions): GetInputProps => {
  const validationBehaviors = {
    ...defaultValidationBehavior,
    ...validationBehavior,
  };

  return <T extends MinimalInputProps>(props = {} as any) => {
    const behavior = hasBeenSubmitted
      ? validationBehaviors.whenSubmitted
      : touched
      ? validationBehaviors.whenTouched
      : validationBehaviors.initial;

    const inputProps: MinimalInputProps = {
      ...props,
      onChange: (...args: unknown[]) => {
        if (behavior === "onChange") validate();
        else clearError();
        return props?.onChange?.(...args);
      },
      onBlur: (...args: unknown[]) => {
        if (behavior === "onBlur") validate();
        setTouched(true);
        return props?.onBlur?.(...args);
      },
      name,
    };

    if (props.type === "checkbox") {
      inputProps.defaultChecked = getCheckboxChecked(props.value, defaultValue);
    } else if (props.type === "radio") {
      inputProps.defaultChecked = getRadioChecked(props.value, defaultValue);
    } else {
      inputProps.defaultValue = defaultValue;
    }

    return omitBy(inputProps, (value) => value === undefined) as T;
  };
};
