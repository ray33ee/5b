const CONVERSION_TYPES = [
	["Decimal", bytes_to_base10, null],
	["Binary", bytes_to_base2, null],
	["Octal", bytes_to_base8, null],
	["Hexadecimal", bytes_to_base16, null],

	[SEPARATOR],

	["Base64", bytes_to_base64, null],
	["Base85", bytes_to_base85, null],
	["Base91", bytes_to_base91, null],

	[SEPARATOR],


	["UTF-8 String", bytes_to_utf8string, null],
	["UTF-8 names", bytes_to_unicode8_names, null],
	
	["UTF-16 String", bytes_to_utf16string, null],
	["UTF-16 names", bytes_to_unicode16_names, null],

	["Non-ascii count", bytes_to_non_ascii_count, null],


	[SEPARATOR],

	["Byte List", bytes_to_bytelist, null],
	["Hex List", bytes_to_hexlist, null],
	["Length", bytes_to_length, null],
	
	[SEPARATOR],

	["URL encode", bytes_to_urlencode, null],
	["C/Python Escaped", bytes_to_c_escaped, null],

	[SEPARATOR],

	["Unix time", bytes_to_unix, 8],
	["ISO 8601", bytes_to_unixiso, 8],

	[SEPARATOR],

	["Double float", bytes_to_f64, null],
	["Single float", bytes_to_f32, null],

	[SEPARATOR],

	["24-bit rgb", bytes_to_rgb, 3],
	["HTML Color", bytes_to_htmlcolor, 3],
	["Nearest color name", bytes_to_colorname, 3],
	["24-bit color", bytes_to_htmlcolor, 3],
	["HSV(0-360, 0-100, 0-100)", bytes_to_hsv, 3],

	["16-bit color", bytes_to_highcolor, 2],
	["16-bit rgb", bytes_to_highcolor_rgb, 2],

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

	[SEPARATOR],

	["MD5", bytes_to_md5, null],
	["SHA256", bytes_to_sha256, null],

	[SEPARATOR],

	["Download", bytes_to_download, null],
];


function bytes_to_length(bytes) {
	if (bytes.length == 1) {
		return "1 byte"
	} else {
		return bytes.length.toLocaleString() + " bytes"
	}
}

function bytes_to_download(bytes) {
	return ""
}

//A list of conversions from bytes to string by possible types
function bytes_to_base64(bytes) {
	s = new String()

	for (byte of bytes) {
		s += String.fromCharCode(byte)
	}

	return btoa(s)
}

function bytes_to_base85(bytes) {

	return ascii85.fromByteArray(bytes, true)
}

function bytes_to_base91(bytes) {
	s = new String()

	for (byte of bytes) {
		s += String.fromCharCode(byte)
	}

	return base91.encode(s)
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

	uint16arr = new Uint16Array(bytes.buffer)

	s = ""

	for (code of uint16arr) {
		s += (String.fromCharCode(code))
	}

	return s
}

function bytes_to_utf8string(bytes) {
	return new TextDecoder().decode(bytes.buffer)
}


function bytes_to_non_ascii_count(bytes) {
	count = 0

	for (byte of bytes) {
		if (byte > 127) {
			count++
		}
	}

	return count + " non-ascii bytes"
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
	s = new TextDecoder().decode(bytes.buffer)



	return bytes_to_unicode16_names(utf16string_to_bytes(s))
}

function _bytes_to_list(bytes, base, prefix) {
	s = "["

	for (byte of bytes) {
		s += prefix + byte.toString(base) + ", "
	}

	s += "]"

	return s
}

function bytes_to_bytelist(bytes) {
	return _bytes_to_list(bytes, 10, "")
}

function bytes_to_hexlist(bytes) {
	return _bytes_to_list(bytes, 16, "0x")
}

function bytes_to_urlencode(bytes) {
	return encodeURIComponent(bytes_to_utf8string(bytes))
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

	data = new Date(Number(_bytes_to_primitive(bytes, "getBigInt64", 8)))

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

function _bytes_to_primitive(bytes, t, size) {
	if (bytes.length != size) {
		throw new FromBytesError(bytes, "primitive", "Could not convert " + bytes.length + " bytes into " + size + " byte float")
	}

	view = new DataView(bytes.buffer)

	return view[t](0, true)
}

function bytes_to_f64(bytes) {

	return _bytes_to_primitive(bytes, "getFloat64", 8).toString()
}

function bytes_to_f32(bytes) {

	return _bytes_to_primitive(bytes, "getFloat32", 4).toString()
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

function bytes_to_sha256(bytes) {
	return _sha256(bytes)
}

function bytes_to_i8(bytes) {
	return _bytes_to_primitive(bytes, "getInt8", 1).toString()
}

function bytes_to_i16(bytes) {
	return _bytes_to_primitive(bytes, "getInt16", 2).toString()
}

function bytes_to_i32(bytes) {
	return _bytes_to_primitive(bytes, "getInt32", 4).toString()
}

function bytes_to_i64(bytes) {
	return _bytes_to_primitive(bytes, "getBigInt64", 8).toString()
}

function bytes_to_u8(bytes) {
	return _bytes_to_primitive(bytes, "getUint8", 1).toString()
}

function bytes_to_u16(bytes) {
	return _bytes_to_primitive(bytes, "getUint16", 2).toString()
}

function bytes_to_u32(bytes) {
	return _bytes_to_primitive(bytes, "getUint32", 4).toString()
}

function bytes_to_u64(bytes) {
	return _bytes_to_primitive(bytes, "getBigUint64", 8).toString()
}

function _bytes_to_highcolor_array(bytes) {
	short = _bytes_to_primitive(bytes, "getUint16", 2)

	b = short & 0x1f
	g = (short >> 5) & 0x3f
	r = (short >> 11) & 0x1f

	arr = new Uint8Array(3)

	arr[0] = b / 32.0 * 255
	arr[1] = g / 64.0 * 255
	arr[2] = r / 32.0 * 255

	return arr
}

function bytes_to_highcolor(bytes) {
	return bytes_to_htmlcolor(_bytes_to_highcolor_array(bytes))
}

function bytes_to_highcolor_rgb(bytes) {
	return bytes_to_rgb(_bytes_to_highcolor_array(bytes))
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

function bytes_to_hsv(bytes) {

	if (bytes.length != 3) {
		throw new FromBytesError(bytes, "hsv color", "hsv color needs exactly 3 bytes")
	}

	r = bytes[2] / 255.0
	g = bytes[1] / 255.0
	b = bytes[0] / 255.0


	v = Math.max(r, g, b)

	c = v - Math.min(r, g, b)

	l = v - c / 2

	if (c == 0) {
		h = 0
	} else if (v == r) {
		h = (360 + 60 * ((g - b) / c)) % 360
	} else if (v == g) {
		h = 60 * ((b-r) / c + 2)
	} else if (v == b) {
		h = 60 * ((r-g) / c + 4)
	}

	if (v == 0) {
		s = 0
	} else {
		s = c / v
	}

	return "hsv(" + Math.floor(h) + ", " + Math.floor(s*100) + ", " + Math.floor(v*100) + ")"
}

function color_distance(r1, g1, b1, r2, g2, b2) {
	return euclid_color_distance(r1, g1, b1, r2, g2, b2)
}

function euclid_color_distance(r1, g1, b1, r2, g2, b2) {
	return Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2)
}

function bytes_to_colorname(bytes) {

	if (bytes.length != 3) {
		throw new FromBytesError(bytes, "color name", "color name needs exactly 3 bytes")
	}

	r1 = bytes[2]
	g1 = bytes[1]
	b1 = bytes[0]

	// Maximum possible length plus 1
	smallest_length = 3 * 255 * 255 + 1
	smallest_name = ""
	smallest_html = ""

	//Brute force search of each named color to find the closest
	for (entry of COLOR_NAMES) {
		r2 = Number("0x" + entry.slice(-6, -4))
		g2 = Number("0x" + entry.slice(-4, -2))
		b2 = Number("0x" + entry.slice(-2, entry.length))

		// If we have an exact match, stop the search
		if (r1 == r2 && g1 == g2 && b1 == b2) {
			return entry.slice(0, -7) + " (" + entry.slice(-7, entry.length) + ")"
		}

		distance = color_distance(r1, g1, b1, r2, g2, b2)

		if (distance < smallest_length) {
			smallest_length = distance
			smallest_name = entry.slice(0, -7)
			smallest_html = entry.slice(-7, entry.length)
		}
	}

	return smallest_name + " (" + smallest_html + ")"
}

