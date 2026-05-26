const printToFileAsync = async () => {
  // Keep only the minimal shape ExportService likely expects
  return {
    uri: 'file:///mock.pdf',
  };
};

export default {
  printToFileAsync,
};

export { printToFileAsync };

