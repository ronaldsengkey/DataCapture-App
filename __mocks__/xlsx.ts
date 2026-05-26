const utils = {
  json_to_sheet: () => ({}),
  aoa_to_sheet: (_sheetData: any[][]) => ({}),
  book_new: () => ({}),
  book_append_sheet: () => {},
};

const write = () => 'base64-xlsx-content';

export default {
  utils,
  write,
};

export { utils, write };

