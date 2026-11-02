const EBML_SEGMENT_ID = BigInt(0x18538067);
const EBML_INFO_ID = BigInt(0x1549a966);
const EBML_DURATION_ID = BigInt(0x4489);
const EBML_TIMECODE_SCALE_ID = BigInt(0x2ad7b1);

type EbmlElement = { dataStart: number; dataEnd: number };

function readVint(data: Uint8Array, offset: number, stripMarker: boolean) {
  if (offset >= data.length) return null;
  const firstByte = data[offset];
  let marker = 0x80;
  let length = 1;
  while (length <= 8 && (firstByte & marker) === 0) {
    marker >>= 1;
    length += 1;
  }
  if (length > 8 || offset + length > data.length) return null;

  let value = BigInt(0);
  for (let index = 0; index < length; index += 1) value = (value << BigInt(8)) | BigInt(data[offset + index]);
  if (stripMarker) value &= (BigInt(1) << BigInt(length * 7)) - BigInt(1);
  return { value, length };
}

function findEbmlElement(data: Uint8Array, start: number, end: number, targetId: bigint): EbmlElement | null {
  let offset = start;
  while (offset < end) {
    const id = readVint(data, offset, false);
    if (!id) return null;
    const size = readVint(data, offset + id.length, true);
    if (!size) return null;

    const dataStart = offset + id.length + size.length;
    const unknownSize = size.value === (BigInt(1) << BigInt(size.length * 7)) - BigInt(1);
    const declaredEnd = unknownSize ? BigInt(end) : BigInt(dataStart) + size.value;
    if (declaredEnd > BigInt(end) || declaredEnd > BigInt(Number.MAX_SAFE_INTEGER)) return null;
    const dataEnd = Number(declaredEnd);
    if (id.value === targetId) return { dataStart, dataEnd };
    if (dataEnd <= offset) return null;
    offset = dataEnd;
  }
  return null;
}

function readUnsigned(data: Uint8Array, start: number, end: number) {
  if (end - start < 1 || end - start > 8) return null;
  let value = BigInt(0);
  for (let index = start; index < end; index += 1) value = (value << BigInt(8)) | BigInt(data[index]);
  return Number(value);
}

function webmDurationSeconds(data: Uint8Array) {
  if (data.length < 4 || data[0] !== 0x1a || data[1] !== 0x45 || data[2] !== 0xdf || data[3] !== 0xa3) return null;
  const segment = findEbmlElement(data, 0, data.length, EBML_SEGMENT_ID);
  if (!segment) return null;
  const info = findEbmlElement(data, segment.dataStart, segment.dataEnd, EBML_INFO_ID);
  if (!info) return null;
  const duration = findEbmlElement(data, info.dataStart, info.dataEnd, EBML_DURATION_ID);
  if (!duration) return null;

  const length = duration.dataEnd - duration.dataStart;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const ticks = length === 4
    ? view.getFloat32(duration.dataStart, false)
    : length === 8
      ? view.getFloat64(duration.dataStart, false)
      : NaN;
  const scaleElement = findEbmlElement(data, info.dataStart, info.dataEnd, EBML_TIMECODE_SCALE_ID);
  const scale = scaleElement ? readUnsigned(data, scaleElement.dataStart, scaleElement.dataEnd) : 1_000_000;
  if (!Number.isFinite(ticks) || !scale) return null;
  return (ticks * scale) / 1_000_000_000;
}

function mp4DurationSeconds(data: Uint8Array) {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let moovStart = -1;
  let moovEnd = -1;
  for (let offset = 0; offset + 8 <= data.length;) {
    const size32 = view.getUint32(offset, false);
    const type = String.fromCharCode(data[offset + 4], data[offset + 5], data[offset + 6], data[offset + 7]);
    const headerLength = size32 === 1 ? 16 : 8;
    const size = size32 === 1
      ? Number(view.getBigUint64(offset + 8, false))
      : size32 === 0
        ? data.length - offset
        : size32;
    if (!Number.isSafeInteger(size) || size < headerLength || offset + size > data.length) return null;
    if (type === "moov") {
      moovStart = offset + headerLength;
      moovEnd = offset + size;
      break;
    }
    offset += size;
  }
  if (moovStart < 0) return null;

  for (let offset = moovStart; offset + 8 <= moovEnd;) {
    const size32 = view.getUint32(offset, false);
    const type = String.fromCharCode(data[offset + 4], data[offset + 5], data[offset + 6], data[offset + 7]);
    const headerLength = size32 === 1 ? 16 : 8;
    const size = size32 === 1
      ? Number(view.getBigUint64(offset + 8, false))
      : size32 === 0
        ? moovEnd - offset
        : size32;
    if (!Number.isSafeInteger(size) || size < headerLength || offset + size > moovEnd) return null;
    if (type === "mvhd") {
      const version = data[offset + headerLength];
      const payloadStart = offset + headerLength;
      const timescaleOffset = payloadStart + (version === 1 ? 20 : 12);
      const durationOffset = timescaleOffset + 4;
      if (version > 1 || durationOffset + (version === 1 ? 8 : 4) > offset + size) return null;
      const timescale = view.getUint32(timescaleOffset, false);
      const duration = version === 1
        ? Number(view.getBigUint64(durationOffset, false))
        : view.getUint32(durationOffset, false);
      return timescale ? duration / timescale : null;
    }
    offset += size;
  }
  return null;
}

export function getVideoDurationSeconds(data: Uint8Array) {
  return webmDurationSeconds(data) ?? mp4DurationSeconds(data);
}
