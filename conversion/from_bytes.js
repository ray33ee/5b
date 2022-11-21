
const CONVERSION_TYPES = [
	["Base 10", bytes_to_base10, null],
	["Base 2", bytes_to_base2, null],
	["Base 8", bytes_to_base8, null],
	["Base 16", bytes_to_base16, null],

	[SEPARATOR],

	["Base64", bytes_to_base64, null],

	[SEPARATOR],


	["UTF-8 String", bytes_to_utf8string, null],
	["UTF-8 names", bytes_to_unicode8_names, null],
	
	["UTF-16 String", bytes_to_utf16string, null],
	["UTF-16 names", bytes_to_unicode16_names, null],

	[SEPARATOR],

	["Byte List", bytes_to_bytelist, null],
	["Length", function(bytes) { return "" + bytes.length + " byte(s)" } , null],

	["URL encode", bytes_to_urlencode, null],
	["C Escaped", bytes_to_c_escaped, null],

	[SEPARATOR],

	["Unix time", bytes_to_unix, 8],
	["ISO 8601", bytes_to_unixiso, 8],

	[SEPARATOR],

	["Double float", bytes_to_f64, 8],
	["Single float", bytes_to_f32, 4],

	[SEPARATOR],

	["24-bit rgb", bytes_to_rgb, 3],
	["HTML Color", bytes_to_htmlcolor, 3],
	["24-bit color", bytes_to_htmlcolor, 3],

	[SEPARATOR],

	["i8", bytes_to_i8, 1],
	["i16", bytes_to_i16, 2],
	["i32", bytes_to_i32, 4],
	["i64", bytes_to_i64, 8],

	[SEPARATOR],

	["u8", bytes_to_u8, 1],
	["u16", bytes_to_u16, 2],
	["u32", bytes_to_u32, 4],
	["u64", bytes_to_u64, 8],

	[SEPARATOR],



	["IPv4", bytes_to_ipv4, 4],
	["IPv6", bytes_to_ipv6, 16],
	["UUID", bytes_to_uuid, 16],
];



//A list of conversions from bytes to string by possible types
function bytes_to_base64(bytes) {
	s = new String()

	for (byte of bytes) {
		s += String.fromCharCode(byte)
	}

	return btoa(s)
}

function _bytes_to_bigint(bytes) {
	multiplier = 1n
	big = 0n

	for (byte of bytes) {
		big += BigInt(byte) * multiplier
		multiplier <<= 8n
	}

	return big
}

function bytes_to_base2(bytes) {
	return _bytes_to_bigint(bytes).toString(2)
}

function bytes_to_base8(bytes) {
	return _bytes_to_bigint(bytes).toString(8)
}

function bytes_to_base10(bytes) {
	return _bytes_to_bigint(bytes).toString(10)
}

function bytes_to_base16(bytes) {
	return _bytes_to_bigint(bytes).toString(16)
}

function bytes_to_utf16string(bytes) {

	if (bytes.length % 2 != 0) {
		throw new FromBytesError(bytes, "utf16 string", "Must be an even number of bytes")
	}

	uint8arr = new Uint8Array(bytes) 

	uint16arr = new Uint16Array(uint8arr.buffer)

	s = ""

	for (code of uint16arr) {
		s += (String.fromCharCode(code))
	}

	return s
}

function bytes_to_utf8string(bytes) {
	return new TextDecoder().decode(new Uint8Array(bytes))
}

function bytes_to_unicode16_names(bytes) {

	out = "["

	s = bytes_to_utf16string(bytes)

	for (code of s) {
		out += get_unicode_name(code.charCodeAt(0)) + " (" + code  + "), "
	}

	return out + "]"
}

function bytes_to_unicode8_names(bytes) {
	s = new TextDecoder().decode(new Uint8Array(bytes))



	return bytes_to_unicode16_names(utf16string_to_bytes(s))
}

function bytes_to_bytelist(bytes) {
	s = "["

	for (byte of bytes) {
		s += byte.toString(10) + ", "
	}

	s += "]"

	return s
}

function bytes_to_urlencode(bytes) {
	return encodeURIComponent(bytes_to_utf16string(bytes, false))
}

function _bytes_to_ip(bytes, size) {

	if (bytes.length != size) {
		throw new FromBytesError(bytes, "ipaddr", "Byte length not supposted (tried " + size + " byte ip against " + bytes.length + " byte list.)" )
	}

	return ipaddr.fromByteArray(bytes).toString()

}

function bytes_to_ipv4(bytes) {

	return _bytes_to_ip(bytes, 4)

}

function bytes_to_ipv6(bytes) {
	return _bytes_to_ip(bytes, 16)

}

function _bytes_to_date(bytes) {

	if (bytes.length != 8) {
		throw new FromBytesError(bytes, "date", "Could not convert " + bytes.length + " bytes into date (must be 8 bytes)")
	}

	uint8arr = new Uint8Array(bytes)

	b = new BigInt64Array(uint8arr.buffer)

	data = new Date(Number(b[0]))

	if (isNaN(data)) {
		throw new FromBytesError(bytes, "date", "Invalid date")
	}

	return data
}

function bytes_to_unix(bytes) {
	return String(_bytes_to_date(bytes))

}

function bytes_to_unixiso(bytes) {
	return _bytes_to_date(bytes).toISOString()
}

function _bytes_to_float(bytes, t, size) {

	if (bytes.length != size) {
		throw new FromBytesError(bytes, "date", "Could not convert " + bytes.length + " bytes into " + size + " byte float")
	}

	uint8arr = new Uint8Array(bytes)

	f = new t(uint8arr.buffer)

	return f[0].toString()
}

function bytes_to_f64(bytes) {

	return _bytes_to_float(bytes, Float64Array, 8)
}

function bytes_to_f32(bytes) {

	return _bytes_to_float(bytes, Float32Array,4)
}

function bytes_to_uuid(bytes) {

	if (bytes.length != 16) {
		throw new FromBytesError(bytes, "uuid", "UUID needs less than 16 bytes")
	}

	hex = bytes_to_base16(bytes, 16)

	if (hex.length < 32) {
		diff = 32 - hex.length
		t = hex
		hex = ""
		for (i = 0; i < diff; i++) {
			hex += "0"
		}
		hex = hex + t
	}

	return hex.slice(0, 8) + "-" + hex.slice(8, 12) + "-" + hex.slice(12, 16) + "-" + hex.slice(16, 20) + "-" + hex.slice(20, 32)
}

function bytes_to_c_escaped(bytes) {
	str = ""

	for (byte of bytes) {
		if (byte == 0x07) {
			str += "\\a"
		} else if (byte == 0x08) {
			str += "\\b"
		} else if (byte == 0x0C) {
			str += "\\f"
		} else if (byte == 0x0A) {
			str += "\\n"
		} else if (byte == 0x0D) {
			str += "\\r"
		} else if (byte == 0x09) {
			str += "\\t"
		} else if (byte == 0x0B) {
			str += "\\v"
		} else if (byte == 0x5C) {
			str += "\\\\"
		} else if (byte == 0x27) {
			str += "\\'"
		} else if (byte == 0x22) {
			str += "\\\""
		} else if (byte >= 32 && byte < 127) {
			str += String.fromCharCode(byte)
		} else {
			str += "\\x" + byte.toString(16)
		}
	}

	return str
}

function bytes_to_md5(bytes) {
	return md5(bytes)
}

function _bytes_to_primitive(bytes, t, pad) {

	if (pad != bytes.length) {
		throw new FromBytesError(bytes, "signed", "Could not convert " + bytes.length + " byte list into " + pad + " byte int")
	}

	uint8arr = new Uint8Array(bytes)

	b = new t(uint8arr.buffer)

	return b[0].toString()
}

function bytes_to_i8(bytes) {
	return _bytes_to_primitive(bytes, Int8Array, 1)
}

function bytes_to_i16(bytes) {
	return _bytes_to_primitive(bytes, Int16Array, 2)
}

function bytes_to_i32(bytes) {
	return _bytes_to_primitive(bytes, Int32Array, 4)
}

function bytes_to_i64(bytes) {
	return _bytes_to_primitive(bytes, BigInt64Array, 8)
}

function bytes_to_u8(bytes) {
	return _bytes_to_primitive(bytes, Uint8Array, 1)
}

function bytes_to_u16(bytes) {
	return _bytes_to_primitive(bytes, Uint16Array, 2)
}

function bytes_to_u32(bytes) {
	return _bytes_to_primitive(bytes, Uint32Array, 4)
}

function bytes_to_u64(bytes) {
	return _bytes_to_primitive(bytes, BigUint64Array, 8)
}

function bytes_to_rgb(bytes) {
	if (bytes.length != 3) {
		throw new FromBytesError(bytes, "rgb", "24-bit rgb needs exactly 3 bytes")
	}

	return "rgb(" + bytes[2] + ", " + bytes[1] + ", " + bytes[0] + ")"
}

function bytes_to_htmlcolor(bytes) {
	if (bytes.length != 3) {
		throw new FromBytesError(bytes, "html color", "24-bit color needs exactly 3 bytes")
	}

	return "#" + bytes[2].toString(16).padStart(2, '0') + bytes[1].toString(16).padStart(2, '0') + bytes[0].toString(16).padStart(2, '0')
}
