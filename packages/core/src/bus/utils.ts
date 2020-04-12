export function removeEmptyValues (obj: any) {
  const cleaned: any = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined && obj[key] !== null) {
      cleaned[key] = obj[key];
    }
  });
  return cleaned;
}

export function keysMatch (obj1: any, obj2: any) {
  const keysObj1 = Object.keys(obj1);
  let allMatch = true;
  keysObj1.forEach((key) => {
    if (obj1[key] !== obj2[key]) {
      allMatch = false;
    }
  });
  return allMatch;
}
