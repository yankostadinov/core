// since "delete" is ~100 times slower
export const removeProp = (object: any, propNameToRemove: string) => {
    return Object.keys(object).reduce((reducedObj, currProp) => {
        if (currProp !== propNameToRemove) {
            reducedObj[currProp] = object[currProp];
        }
        return reducedObj;
    }, {} as any);
};

// TODO: write a test
