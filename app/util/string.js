
const string = {
  /**
   * {JSDoc}
   *
   * The splice() method changes the content of a string by removing a range of
   * characters and/or adding new characters.
   *
   * @param {string} string to be maniplated
   * @param {number} start Index at which to start changing the string.
   * @param {number} delCount An integer indicating the number of old chars to remove.
   * @param {string} newSubStr The String that is spliced in.
   * @return {string} A new string with the spliced substring.
   */
  splice(str, start, delCount, newSubStr) {
    const newStr = str.slice(0, start) + newSubStr + str.slice(start + Math.abs(delCount));
    return newStr;
  },

  isASCII(str) {
    return /^[\x00-\x7F]*$/.test(str);
  },

  convertByteArrayToString(array, encoding) {
    var iconv = require('iconv-lite');
    // const StringDecoder = require('string_decoder').StringDecoder;
    return iconv.decode(array, encoding);
    // return new StringDecoder(encoding).decode(array);
  },
};

export default string;
