export const Select = function (
  selectOptions: (string | Record<string, string>)[]
) {
  return function (OjectToCompare: any) {
    let tempObj = {} as any;
    let newKey: string | undefined = undefined;
    Object.entries(OjectToCompare).filter(([key, value]: any) => {
      let shouldSelect: boolean;
      for (let option of selectOptions) {
        if (typeof option === "string") {
          shouldSelect = option === key;
        } else {
          shouldSelect = Object.keys(option).includes(key);
          newKey = option[key];
        }
        if (shouldSelect) {
          if (newKey !== undefined) {
            tempObj[newKey] = value;
          } else {
            tempObj[key] = value;
          }
          break;
        }
      }
    });

    return tempObj;
  };
};
