/**
 * The purpose of this type is to simplify the logic
 * around data that needs to come from the server initially,
 * but from the internal state after hydration.
 */
export type Hydratable<T> = {
  hydrateTo: (data: T) => T;
  hydrateOrSelect: <U>(data: U, selector: (val: T) => U) => U;
};

const serverData = <T>(serverData: T): Hydratable<T> => ({
  hydrateTo: () => serverData,
  hydrateOrSelect: (_, selector) => selector(serverData),
});

const hydratedData = <T>(): Hydratable<T> => ({
  hydrateTo: (hydratedData: T) => hydratedData,
  hydrateOrSelect: (data) => data,
});

const from = <T>(data: T, hydrated: boolean): Hydratable<T> =>
  hydrated ? hydratedData<T>() : serverData<T>(data);

export const hydratable = {
  serverData,
  hydratedData,
  from,
};
