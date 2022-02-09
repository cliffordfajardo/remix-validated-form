export const getCheckboxChecked = (
  checkboxValue: string | undefined = "on",
  newValue: unknown
) => {
  if (Array.isArray(newValue)) return newValue.includes(checkboxValue);
  if (typeof newValue === "boolean") return newValue;
  if (typeof newValue === "string") return newValue === checkboxValue;
  return undefined;
};
