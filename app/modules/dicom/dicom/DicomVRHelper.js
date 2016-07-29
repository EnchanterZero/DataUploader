function isOtherByteOrWordVR(vr) {
  return vr && (
    vr === 'OB' ||
    vr === 'OW' ||
    vr === 'OX'
  );
}

function isOtherByteOrWordOrFloatVR(vr) {
  return vr && (
    vr === 'OB' ||
    vr === 'OF' ||
    vr === 'OW' ||
    vr === 'OX'
  );
}

function isSequenceVR(vr) {
  return vr && vr === 'SQ';
}

function isUnknownVR(vr) {
  return vr && vr === 'UN';
}

function isUnlimitedTextVR(vr) {
  return vr && vr === 'UT';
}

function isStringVR(vr) {
  return vr &&
    (vr === 'AE' || vr === 'AS' || vr === 'CS' || vr === 'DA' || vr === 'DT' || vr === 'DS' || vr ===
      'IS' || vr === 'LO' || vr === 'LT' || vr === 'PN' || vr === 'SH' || vr === 'ST' || vr ===
      'TM' || vr === 'UI' || vr === 'UT');
}

function isNumericVR(vr) {
  return vr &&
    (vr === 'OB' || vr === 'OW' || vr === 'OX' || vr === 'SL' || vr === 'SS' || vr === 'UL' || vr ===
      'US' || vr === 'XL' || vr === 'XS');
}

function isFloatVR(vr) {
  return vr &&
    (vr === 'FL' || vr === 'FD');
}

function isTagVR(vr) {
  return vr && vr === 'AT';
}

function sizeofNumericVR(vr) {
  if (vr === 'OB' || vr === 'OX')
    return 1;
  else if (vr === 'OW' || vr === 'US' || vr === 'SS' || vr === 'XS')
    return 2;
  else if (vr === 'SL' || vr === 'UL' || vr === 'XL')
    return 4;
  else {
    Assert(0);
  }
  return 0;
}

function sizeofFloatVR(vr) {
  if (vr === 'FL')
    return 4;
  else if (vr === 'FD')
    return 8;
  else {
    Assert(0);
  }
  return 0;
}
