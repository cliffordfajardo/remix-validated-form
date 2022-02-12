import invariant from "tiny-invariant";

/**
 * Helper class to track the values being set on uncontrolled fields.
 * HTML is super permissive with inputs that all share the same `name`.
 *
 * This class is strict in the sense that, if the user provides an array value,
 * the values inside the array must be in the same order as the elements in the DOM.
 * Doing this allows us to be flexible with what types of form controls the user is using.
 *
 * This is how HTML tracks inputs of the same name as well.
 * `new FormData(formElement).getAll('myField')` will return values in DOM order.
 */
class Values {
  protected values: string[];
  protected hasSetRadioValue = false;

  constructor(values: unknown | unknown[]) {
    const unknownValues = Array.isArray(values) ? values : [values];
    invariant(
      unknownValues.every((value) => typeof value === "string"),
      "Values for non-controlled fields can only be strings, arrays of strings, or booleans (for checkboxes)."
    );
    this.values = unknownValues;
  }

  bool = (value: string) => {
    if (this.values[0] === value) {
      this.values.shift();
      return true;
    }
    return false;
  };

  radio = (value: string) => {
    if (this.hasSetRadioValue) return false;
    const result = this.bool(value);
    if (result) this.hasSetRadioValue = true;
    return result;
  };

  str = () => this.values.pop() ?? "";

  allValues = () => this.values;

  warnIfLeftovers = (field: string) => {
    if (this.values.length > 0) {
      console.warn(
        `Could not determine how to use the value for the field ${field}. ` +
          `Leftover values were: ${this.values.join(", ")}.`
      );
    }
  };
}

/**
 * This subclass is order-permissive, meaning the user doesn't have to worry about
 * the order in which the inputs occur in the DOM.
 * This is useful for multiselects and checkbox groups and provides a better DX than
 * the order-strict version.
 */
class PermissiveValues extends Values {
  private has = (value: string) => this.values.includes(value);

  private remove = (value: string) => {
    invariant(this.has(value), "Value not found");
    const index = this.values.indexOf(value);
    this.values.splice(index, 1);
  };

  override bool = (value: string) => {
    if (this.has(value)) {
      this.remove(value);
      return true;
    }
    return false;
  };
}

const isMultiselect = (node: Node): node is HTMLSelectElement =>
  node instanceof HTMLSelectElement && node.multiple;

const isCheckbox = (node: Node | RadioNodeList): node is HTMLInputElement =>
  node instanceof HTMLInputElement && node.type === "checkbox";

const isRadio = (node: Node): node is HTMLInputElement =>
  node instanceof HTMLInputElement && node.type === "radio";

const setElementValue = (element: Node, values: Values) => {
  if (isMultiselect(element)) {
    for (const option of element.options) {
      option.selected = values.bool(option.value);
    }
    return;
  }

  if (isCheckbox(element)) {
    element.checked = values.bool(element.value);
    return;
  }

  if (isRadio(element)) {
    element.checked = values.radio(element.value);
    return;
  }

  const input = element as HTMLInputElement;
  input.value = values.str();
};

const areElementsTheSameType = (nodes: Node[]): boolean => {
  const getType = (node: Node) => {
    if (node instanceof HTMLInputElement) return node.type;
    if (node instanceof HTMLSelectElement)
      return node.multiple ? "select" : "multiselect";
    return null;
  };
  const firstElementInstance = nodes[0].constructor;
  const firstElementType = getType(nodes[0]);
  return nodes.every(
    (element) =>
      element.constructor === firstElementInstance &&
      getType(element) === firstElementType
  );
};

export const setInputValueInForm = (
  formElement: HTMLFormElement,
  name: string,
  value: unknown
) => {
  const controlElement = formElement.elements.namedItem(name);
  if (!controlElement) return;

  if (typeof value === "boolean") {
    invariant(
      isCheckbox(controlElement),
      "Only checkboxes can be set using a boolean."
    );
    controlElement.checked = value;
    return;
  }

  if (controlElement instanceof RadioNodeList) {
    const values = areElementsTheSameType([...controlElement])
      ? new PermissiveValues(value)
      : new Values(value);

    for (const element of controlElement) {
      setElementValue(element, values);
    }
    values.warnIfLeftovers(name);
  } else {
    const values = new PermissiveValues(value);
    setElementValue(controlElement, values);
    values.warnIfLeftovers(name);
  }
};
