export function memcpy(src, srcOffset, dst, dstOffset, length) {
  let i

  src = src.subarray || src.slice ? src : src.buffer
  dst = dst.subarray || dst.slice ? dst : dst.buffer

  src = srcOffset ? (src.subarray ? src.subarray(srcOffset, length && srcOffset + length) : src.slice(srcOffset, length && srcOffset + length)) : src

  if (dst.set) {
    dst.set(src, dstOffset)
  } else {
    for (i = 0; i < src.length; i++) {
      dst[i + dstOffset] = src[i]
    }
  }

  return dst
}
