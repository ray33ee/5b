
const CONVERSION_TYPES = [
	["Base 10", bytes_to_base10],
	["Base 2", bytes_to_base2],
	["Base 8", bytes_to_base8],
	["Base 16", bytes_to_base16],

	[SEPARATOR],

	["Base64", bytes_to_base64],

	[SEPARATOR],

	["String", bytes_to_string],
	["Byte List", bytes_to_bytelist],

	[SEPARATOR],

	["URL encode", bytes_to_urlencode],
	["C Escaped", bytes_to_c_escaped],

	[SEPARATOR],

	["Unix time", bytes_to_unix],
	["ISO 8601", bytes_to_unixiso],

	[SEPARATOR],

	["Double float", bytes_to_f64],
	["Single float", bytes_to_f32],

	[SEPARATOR],



	["i8", bytes_to_i8],
	["i16", bytes_to_i16],
	["i32", bytes_to_i32],
	["i64", bytes_to_i64],

	[SEPARATOR],

	["u8", bytes_to_u8],
	["u16", bytes_to_u16],
	["u32", bytes_to_u32],
	["u64", bytes_to_u64],

	[SEPARATOR],



	["IPv6", bytes_to_ipv6],
	["IPv4", bytes_to_ipv4],
	["UUID", bytes_to_uuid],
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

function bytes_to_string(bytes) {
	

	return _bytes_to_string(bytes, true)

}

function _bytes_to_string(bytes, check) {
	
	s = new String()

	for (byte of bytes) {
		if (check == true && !(byte >= 32 && byte < 127)) {
			throw new FromBytesError(bytes, "string", "String contains unprintable characters (outside 32-126 range)")
		}

		s += String.fromCharCode(byte)
	}

	//
	bytes_to_bytelist(bytes)

	return utf8.decode(s)

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
	return encodeURIComponent(_bytes_to_string(bytes, false))
}

function _bytes_to_ip(bytes, size) {

	if (bytes.length != size) {
		throw new FromBytesError(bytes, "ipaddr", "Byte length not supposted (tried " + size + " byte ip against " + bytes.length + " byte list.)" )
	}

	return ipaddr.fromByteArray(pad_to(bytes, size)).toString()

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

	big = _bytes_to_bigint(bytes)

	data = new Date(Number(big))

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

	uint8arr = new Uint8Array(pad_to(bytes, pad))

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
