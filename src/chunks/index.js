// @flow
import {FloatChunk} from '../protocol-buffers/chunk_pb';
import {fetchBlob} from '../ajax';

export const fetchChunk = (url: string): Promise<FloatChunk> => {
  return fetchBlob(url).then((blob) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(blob);
    return new Promise((resolve) => {
      reader.addEventListener('loadend', () => {
        const parsed = FloatChunk.deserializeBinary(reader.result);
        resolve({
          index: parsed.getIndex(),
          cutoff: parsed.getCutoff(),
          downsampling: parsed.getDownsampling(),
          values: parsed.getSamplesList(),
        });
      });
    });
  });
};
