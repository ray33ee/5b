

const BYTE_LIST_REGEX = /\[?(?<inner>(?:(?:0[obx])?[0-9A-Fa-f]+,)*(?:0[obx])?[0-9A-Fa-f]+,?)\]?/
const BYTE_LIST_ELEMENT_REGEX = /(?<number>(?:0[obx])?[0-9A-Fa-f]+),?/g

const UUID_REGEX = /[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}/

// Here we create a possible type map from name to conversion function.
// Note: The order of this list is important as it is designed such that the more used conversions are listed first.
// Since dictionaries aren't guaranteed to preserve order, a list of pairs is used instead 
const POSSIBLE_TYPES = [
	["Base64", base64_to_bytes],
	["Integer", integer_to_bytes],
	["String", string_to_bytes],
	["URL Decode", urldecode_to_bytes],
	["Double float", f64_to_bytes],
	["Single float", f32_to_bytes],
	["Base2", base2_to_bytes],
	["Base8", base8_to_bytes],
	["Base16", base16_to_bytes],
	["IPv4", ipv4_to_bytes],
	["IPv6", ipv6_to_bytes],
	["Byte List", bytelist_to_bytes],
	["Date/Time", datetime_to_bytes],
	["UUID", uuid_to_bytes],
	["i8", i8_to_bytes],
	["i16", i16_to_bytes],
	["i32", i32_to_bytes],
	["i64", i64_to_bytes],
	["u8", u8_to_bytes],
	["u16", u16_to_bytes],
	["u32", u32_to_bytes],
	["u64", u64_to_bytes],
	["C Escaped", c_escaped_to_bytes],

];


function base64_to_bytes(string) {

	decode = atob(string)

	array = []

	for (byte of decode) {
		array.push(byte.charCodeAt(0))
	}

	return array;
}

function integer_to_bytes(string) {
	i = BigInt(string)

	if (i == 0n) {
		return [0]
	}

	if (i < 0n) {
		throw "Cannot convert"
	}

	array = []

	while (i != 0n) {
		array.push(Number(i % 256n))
		i = i >> 8n
	}

	return array
}

function base2_to_bytes(string) {
	return integer_to_bytes("0b" + string)
}

function base8_to_bytes(string) {
	return integer_to_bytes("0o" + string)
}

function base16_to_bytes(string) {
	return integer_to_bytes("0x" + string)
}

function string_to_bytes(string) {
	string = utf8.encode(string)
	array = []

	for (char of string) {
		array.push(char.charCodeAt(0))
	}

	return array
}

function urldecode_to_bytes(string) {
	return string_to_bytes(decodeURIComponent(string))
}

function f64_to_bytes(string) {
	f = Number(string)

	if (isNaN(f) && string != "NaN") {
		throw "Cannot convert string to f64"
	}

	var f64_arr = new Float64Array(1);
	f64_arr[0] = f;

	return Array.from(new Uint8Array(f64_arr.buffer))
}

function f32_to_bytes(string) {
	f = Number(string)

	if (isNaN(f) && string != "NaN") {
		throw "Cannot convert string to f64"
	}

	var f32_arr = new Float32Array(1);
	f32_arr[0] = f;

	return Array.from(new Uint8Array(f32_arr.buffer))
}

function ipv4_to_bytes(string) {
	
	if (!ipaddr.IPv4.isValid(string)) {
		throw "Cannot convert"
	}
	
	return ipaddr.parse(string).toByteArray()
}

function ipv6_to_bytes(string) {
	
	if (!ipaddr.IPv6.isValid(string)) {
		throw "Cannot convert"
	}
	
	return ipaddr.parse(string).toByteArray()
}

function bytelist_to_bytes(string) {
	string = string.replace(/\s/g, '')

	result = BYTE_LIST_REGEX.exec(string)

	arr = []

	for (m of result["groups"]["inner"].matchAll(BYTE_LIST_ELEMENT_REGEX)) {
		n = Number(m["groups"]["number"])
		if (n > 255 || isNaN(n)) {
			throw "Cannot convert"
		}
		arr.push(n)
	}
	
	return arr
}

function datetime_to_bytes(string) {
	epoch = Date.parse(string)

	if (isNaN(epoch)) {
		throw "Cannot convert"
	}

	thing = new BigInt64Array(1)
	thing[0] = BigInt(epoch)


	arr = Array.from(new Uint8Array(thing.buffer))


	return arr

}

function uuid_to_bytes(string) {
	if (UUID_REGEX.test(string)) {
		string = string.replace(/-/g, '')

		return base16_to_bytes(string)
	} else {
		throw "Cannot convert"
	}
}

function _signed_to_bytes(string, t) {
	n = Number(string)

	b = new t(1)
	b[0] = n


	return Array.from(new Uint8Array(b.buffer))
}

function i8_to_bytes(string) {
	return _signed_to_bytes(string, Int8Array)
}

function i16_to_bytes(string) {
	return _signed_to_bytes(string, Int16Array)
}

function i32_to_bytes(string) {
	return _signed_to_bytes(string, Int32Array)
}

function i64_to_bytes(string) {
	n = BigInt(string)

	b = new BigInt64Array(1)
	b[0] = n


	return Array.from(new Uint8Array(b.buffer))
}

function u8_to_bytes(string) {
	return _signed_to_bytes(string, Uint8Array)
}

function u16_to_bytes(string) {
	return _signed_to_bytes(string, Uint16Array)
}

function u32_to_bytes(string) {
	return _signed_to_bytes(string, Uint32Array)
}

function u64_to_bytes(string) {
	n = BigInt(string)

	b = new BigUint64Array(1)
	b[0] = n


	return Array.from(new Uint8Array(b.buffer))
}

function c_escaped_to_bytes(string) {
	s = string

	output = []

	// Iterate over each unicode code point, If it's not ascii, cannot convert
	for (char of Array.from(s)) {

		code_point = char.charCodeAt(0)

		if (code_point > 128) {
			throw "Cannot convert"
		}
	}


	for (i = 0; i < s.length; i++) {
		char = s[i]
		code = s.charCodeAt(i)

		if (char == "\\") {
			identifier = s[i+1]

			if (identifier == "a") {
				output.push(0x07)
				i += 1
			} else if (identifier == "b") {
				output.push(0x08)
				i += 1
			} else if (identifier == "f") {
				output.push(0x0C)
				i += 1
			} else if (identifier == "n") {
				output.push(0x0A)
				i += 1
			} else if (identifier == "r") {
				output.push(0x0D)
				i += 1
			} else if (identifier == "t") {
				output.push(0x09)
				i += 1
			} else if (identifier == "v") {
				output.push(0x0B)
				i += 1
			} else if (identifier == "\\") {
				output.push(0x5C)
				i += 1
			} else if (identifier == "'") {
				output.push(0x27)
				i += 1
			} else if (identifier == "\"") {
				output.push(0x22)
				i += 1
			} else if (identifier == "x") {
				n = Number("0x" + s.slice(i+2, i+4))

				if (isNaN(n)) {
					throw "Cannot convert"
				}

				output.push(n)
				i += 3
				
			} else if (identifier == "u") {
				throw "C Escaped: 'u' Not yet supported"
			} else if (identifier == "U") {
				throw "C Escaped: 'U' Not yet supported"
			} else {
				throw "Cannot convert"
			}

		} else {
			output.push(code)
		}

	}

	return output
}



