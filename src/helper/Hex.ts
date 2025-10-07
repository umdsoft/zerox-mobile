let BASELENGTH = 128;

let LOOKUPLENGTH = 16;

let hexNumberTable = [];

let lookUpHexAlphabet = [];

function decode(encoded) {
  if (encoded == null) {
    return null;
  }
  const lengthData = encoded.length;
  if (lengthData % 2 !== 0) {
    return null;
  }
  const binaryData = /* toCharArray */ encoded.split('');
  const lengthDecode = (lengthData / 2) | 0;
  const decodedData = (s => {
    let a = [];
    while (s-- > 0) a.push(0);
    return a;
  })(lengthDecode);
  let temp1;
  let temp2;
  let tempChar;
  for (let i = 0; i < lengthDecode; i++) {
    tempChar = binaryData[i * 2];
    temp1 =
      (c => (c.charCodeAt == null ? c : c.charCodeAt(0)))(tempChar) < BASELENGTH
        ? hexNumberTable[tempChar.charCodeAt(0)]
        : -1;
    if (temp1 === -1) {
      return null;
    }
    tempChar = binaryData[i * 2 + 1];
    temp2 =
      (c => (c.charCodeAt == null ? c : c.charCodeAt(0)))(tempChar) < BASELENGTH
        ? hexNumberTable[tempChar.charCodeAt(0)]
        : -1;
    if (temp2 === -1) {
      return null;
    }
    decodedData[i] = (temp1 << 4) | temp2 | 0;
  }
  return decodedData;
}

export {decode};
