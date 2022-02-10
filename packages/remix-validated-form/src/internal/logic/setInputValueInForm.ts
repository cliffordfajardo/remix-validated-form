import invariant from "tiny-invariant";
import { getCheckboxChecked } from "./getCheckboxChecked";
import { getRadioChecked } from "./getRadioChecked";

const setElementValue = (element: Node, value: unknown, name: string) => {
  if (element instanceof HTMLSelectElement && element.multiple) {
    invariant(
      Array.isArray(value),
      "Must specify an array to set the value for a multi-select"
    );
    for (const option of element.options) {
      option.selected = value.includes(option.value);
    }
    return;
  }

  if (element instanceof HTMLInputElement && element.type === "checkbox") {
    const newChecked = getCheckboxChecked(element.value, value);
    invariant(
      newChecked !== undefined,
      `Unable to determine if checkbox should be checked. Provided value was ${value} for checkbox ${name}.`
    );
    element.checked = newChecked;
    return;
  }

  if (element instanceof HTMLInputElement && element.type === "radio") {
    const newChecked = getRadioChecked(element.value, value);
    invariant(
      newChecked !== undefined,
      `Unable to determine if radio should be checked. Provided value was ${value} for radio ${name}.`
    );
    element.checked = newChecked;
    return;
  }

  invariant(
    typeof value === "string",
    `Invalid value for field "${name}" which is an ${
      element.constructor.name
    }. Expected string but received ${typeof value}`
  );
  const input = element as HTMLInputElement;
  input.value = value;
};

export const setInputValueInForm = (
  formElement: HTMLFormElement,
  name: string,
  value: unknown
) => {
  const controlElement = formElement.elements.namedItem(name);
  if (!controlElement) return;

  if (controlElement instanceof RadioNodeList) {
    for (const element of controlElement) {
      setElementValue(element, value, name);
    }
  } else {
    setElementValue(controlElement, value, name);
  }
};
