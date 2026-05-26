const SaveFormat = {
  JPEG: 'jpeg',
};

async function manipulateAsync(uri: string, actions: any[], options: any) {
  return {
    uri,
    // keep parity with expo-image-manipulator API shape used in code
    actions,
    options,
  };
}

export { SaveFormat };
export default {
  manipulateAsync,
  SaveFormat,
};
export { manipulateAsync };

