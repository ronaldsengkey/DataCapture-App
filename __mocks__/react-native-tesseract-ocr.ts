const recognize = async () => {
  // Minimal shape used by AIEngineService: result.lines[].bbox + confidence
  return {
    text: 'mock text',
    lines: [
      {
        confidence: 0.9,
        bbox: { x0: 10, y0: 10, x1: 110, y1: 30 },
      },
      {
        confidence: 0.8,
        bbox: { x0: 10, y0: 40, x1: 110, y1: 60 },
      },
      {
        confidence: 0.85,
        bbox: { x0: 20, y0: 45, x1: 120, y1: 65 },
      },
      {
        confidence: 0.83,
        bbox: { x0: 15, y0: 50, x1: 115, y1: 70 },
      },
    ],
  };
};

const init = async () => {
  return true;
};

export default {
  init,
  recognize,
};

export { init, recognize };

