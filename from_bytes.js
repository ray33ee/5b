
const CONVERSION_TYPES = [
	["Base 10", bytes_to_base10],
	["Base 2", bytes_to_base2],
	["Base 8", bytes_to_base8],
	["Base 16", bytes_to_base16],
	["Base64", bytes_to_base64],
	["String", bytes_to_string],
	["Byte List", bytes_to_bytelist],
	["URL encode", bytes_to_urlencode],
	["Unix time", bytes_to_unix],
	["ISO 8601", bytes_to_unixiso],
	["Double float", bytes_to_f64],
	["Single float", bytes_to_f32],
	["UUID", bytes_to_uuid],
	["C Escaped", bytes_to_c_escaped],
	["IPv4", bytes_to_ipv4],
	["IPv6", bytes_to_ipv6],
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
	
	s = new String()

	for (byte of bytes) {
		s += String.fromCharCode(byte)
	}

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
	return encodeURIComponent(bytes_to_string(bytes))
}

function bytes_to_ipv4(bytes) {

	if (bytes.length > 4) {
		throw "Cannot convert"
	}

	return ipaddr.fromByteArray(pad_to(bytes, 4)).toString()

}

function bytes_to_ipv6(bytes) {

	if (bytes.length > 16) {
		throw "Cannot convert"
	}

	return ipaddr.fromByteArray(pad_to(bytes, 16)).toString()

}

function bytes_to_unix(bytes) {
	big = _bytes_to_bigint(bytes)

	data = new Date(Number(big))

	if (isNaN(data)) {
		throw "Cannot convert"
	}

	return data
}

function bytes_to_unixiso(bytes) {
	big = _bytes_to_bigint(bytes)

	data = new Date(Number(big))

	if (isNaN(data)) {
		throw "Cannot convert"
	}

	return data.toISOString()
}

function bytes_to_f64(bytes) {
	uint8arr = new Uint8Array(bytes)

	f64arr = new Float64Array(uint8arr.buffer)

	return f64arr[0].toString()
}

function bytes_to_f32(bytes) {
	uint8arr = new Uint8Array(bytes)

	f32arr = new Float32Array(uint8arr.buffer)

	return f32arr[0].toString()
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
	
	url_encoded = encodeURI(bytes_to_string(bytes))

	out = []

	for (i = 0; i < url_encoded.length; i++) {
		char_code = url_encoded.charCodeAt(i)
		char = url_encoded[i]


		if (char_code == 0x25) {
			percent_code = url_encoded.slice(i+1, i+3)
			percent_number = Number("0x" + percent_code)

			// If the character is printable
			if (percent_number >= 32 && percent_number < 127) {

				if (percent_number == 0x5c) {
					out += "\\\\"
				} else if (percent_number == 0x22) {
					out += "\\\""
				} else {
					out += String.fromCharCode(percent_number)
				}

				
			} else {

				escape_sequence = ""

				if (percent_number == 0x00) {
					escape_sequence = "\\0"
				} else if (percent_number == 0x07) {
					escape_sequence = "\\a"
				} else if (percent_number == 0x08) {
					escape_sequence = "\\b"
				} else if (percent_number == 0x0C) {
					escape_sequence = "\\f"
				} else if (percent_number == 0x0A) {
					escape_sequence = "\\n"
				} else if (percent_number == 0x0D) {
					escape_sequence = "\\r"
				} else if (percent_number == 0x09) {
					escape_sequence = "\\t"
				} else if (percent_number == 0x0b) {
					escape_sequence = "\\v"
				} else {
					escape_sequence = "\\x" + percent_code
				}

				out += escape_sequence
			}

			i = i + 2
		} else {

			if (char_code == 0x27) {
				out += "\\'"
			} else {

				out += char
			}
		}

		

	}

	return out
	
}
