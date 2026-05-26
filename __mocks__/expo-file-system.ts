const documentDirectory = 'file:///mock-document-directory/';

const EncodingType = {
  Base64: 'base64',
};

const state = {
  dirs: new Set<string>(),
  written: new Map<string, string>(),
  copied: [] as Array<{ from: string; to: string }>,
};

const getInfoAsync = async (uri: string) => {
  return { exists: state.dirs.has(uri) };
};

const makeDirectoryAsync = async (uri: string, _opts?: any) => {
  state.dirs.add(uri);
  return uri;
};

const copyAsync = async ({ from, to }: { from: string; to: string }) => {
  state.copied.push({ from, to });
  // pretend copy succeeded
  return { from, to };
};

const writeAsStringAsync = async (fileUri: string, contents: string, _opts?: any) => {
  state.written.set(fileUri, contents);
  return fileUri;
};

const __getMockState = () => state;

export default {
  documentDirectory,
  EncodingType,
  getInfoAsync,
  makeDirectoryAsync,
  copyAsync,
  writeAsStringAsync,
  __getMockState,
};

export {
  documentDirectory,
  EncodingType,
  getInfoAsync,
  makeDirectoryAsync,
  copyAsync,
  writeAsStringAsync,
  __getMockState,
};
