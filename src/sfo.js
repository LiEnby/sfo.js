function _arrayBuilder(length, callback) {
  return Array(length).fill().map((_, i) => callback(i));
}

function _mapArrayToObject(array, callback) {
  return array.reduce((o, entry) => ({ ...o, ...callback(entry)}), {});
}

function readString(array, offset) {
	return new TextDecoder('utf-8').decode(
    array.slice(
      offset,
      offset + array.slice(offset).indexOf(0)
    )
  );
}

const PSF_TYPE_BIN = 0;
const PSF_TYPE_STR = 2;
const PSF_TYPE_VAL = 4;

function buildHeader(view) {
  return {
		magic: view.getUint32(0, true),
		version: view.getUint32(4, true),
		keyofs: view.getUint32(8, true),
		valofs: view.getUint32(12, true),
		count: view.getUint32(16, true),
  };
}

function buildEntry(i, view) {
  return {
    // TODO: change this shitty names to something better
    nameofs: view.getUint16(i, true),
    alignment: view.getUint8(i + 2, true),
    type: view.getUint8(i + 3, true),
    valsize: view.getUint32(i + 4, true),
    totalsize: view.getUint32(i + 8, true),
    dataofs: view.getUint32(i + 12, true),
  }
}

function buildEntryValue(entry, header, view) {
  const keyOffset = header.keyofs + entry.nameofs;
  const valueOffset = header.valofs + entry.dataofs;
  // TODO: this can be better
  const array = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
  const key = readString(array, keyOffset)
  const value = generateValue(entry, array, valueOffset);

  return { [key]: value };
}

function generateValue(entry, array, offset) {
  switch (entry.type) {
    case PSF_TYPE_VAL:
      return 0; // wtf is this silica
    case PSF_TYPE_BIN:
      // TODO: check if works
      return array.slice(offset, entry.valsize);
    case PSF_TYPE_STR:
      return readString(array, offset);
    default:
      return 'Unknown Type';
  }
}

function parseSfo(bytes) {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const header = buildHeader(view);

	if(header.magic !== 0x46535000) {
    return null;
  }

  const entries = _arrayBuilder(header.count, (i) => buildEntry(20 + i * 16, view));  
  return _mapArrayToObject(entries, (entry) => buildEntryValue(entry, header, view));
}

if (typeof window === 'undefined') {
  // TODO: publish to npm
  module.exports = parseSfo;
}
