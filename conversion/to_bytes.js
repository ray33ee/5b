

const BYTE_LIST_REGEX = /\[?(?<inner>(?:(?:0[obx])?[0-9A-Fa-f]+,)*(?:0[obx])?[0-9A-Fa-f]+,?)\]?/
const BYTE_LIST_ELEMENT_REGEX = /(?<number>(?:0[obx])?[0-9A-Fa-f]+),?/g

const UUID_REGEX = /[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}/

// Here we create a possible type map from name to conversion function.
// Note: The order of this list is important as it is designed such that the more used conversions are listed first.
// Since dictionaries aren't guaranteed to preserve order, a list of pairs is used instead 
const POSSIBLE_TYPES = [
	["Base64", base64_to_bytes, false],
	["Integer", integer_to_bytes, true],
	["UTF-16 String", utf16string_to_bytes, false],
	["URL Decode", urldecode_to_bytes, false],
	["Double float", f64_to_bytes, false],
	["Single float", f32_to_bytes, false],
	["Base2", base2_to_bytes, true],
	["Base8", base8_to_bytes, true],
	["Base16", base16_to_bytes, true],
	["IPv4", ipv4_to_bytes, false],
	["IPv6", ipv6_to_bytes, false],
	["Byte List", bytelist_to_bytes, false],
	["Date/Time", datetime_to_bytes, false],
	["UUID", uuid_to_bytes, false],
	["i8", i8_to_bytes, false],
	["i16", i16_to_bytes, false],
	["i32", i32_to_bytes, false],
	["i64", i64_to_bytes, false],
	["u8", u8_to_bytes, true],
	["u16", u16_to_bytes, true],
	["u32", u32_to_bytes, true],
	["u64", u64_to_bytes, true],
	["C Escaped", c_escaped_to_bytes, false],

];


function base64_to_bytes(string) {

	try {
		decode = atob(string)
	} catch (err) {
		throw new ToBytesError(string, "base64", String(err))
	}

	array = []

	for (byte of decode) {
		array.push(byte.charCodeAt(0))
	}

	return array;
}

function integer_to_bytes(string) {
	try {
		i = BigInt(string)
	} catch (err) {
		throw new ToBytesError(string, "bigint", String(err))
	}

	if (i == 0n) {
		return [0]
	}

	if (i < 0n) {
		throw new ToBytesError(string, "bigint", "Big int cannot be used for negative numbers, as fixed width primitives should be used instead (i8, i16, etc.)")
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

function utf16string_to_bytes(string) {
	array = []

	for (char of string) {
		array.push(char.charCodeAt(0))
	}

	a = new Uint16Array(array)

	return Array.from(new Uint8Array(a.buffer))
}

function urldecode_to_bytes(string) {

	try {
		d = decodeURIComponent(string)
	} catch (err) {
		throw new ToBytesError(string, "url decode", err)
	}
	return utf16string_to_bytes(d)
}

function f64_to_bytes(string) {
	return _float_to_bytes(string, Float64Array)
}

function f32_to_bytes(string) {
	return _float_to_bytes(string, Float32Array)
}

function _float_to_bytes(string, type) {
	f = Number(string)

	if (isNaN(f) && string != "NaN") {
		throw new ToBytesError(string, "float", "Invalid float")
	}

	var fa = new type(1);
	fa[0] = f;

	return Array.from(new Uint8Array(fa.buffer))
}

function ipv4_to_bytes(string) {
	return _ipaddr_to_bytes(string, ipaddr.IPv4)
}

function ipv6_to_bytes(string) {
	return _ipaddr_to_bytes(string, ipaddr.IPv6)
}

function _ipaddr_to_bytes(string, type) {
	if (!type.isValid(string)) {
		throw  new ToBytesError(string, "ipaddr", "String is not a valid address")
	}
	
	return ipaddr.parse(string).toByteArray()
}

function bytelist_to_bytes(string) {
	string = string.replace(/\s/g, '')

	result = BYTE_LIST_REGEX.exec(string)

	arr = []

	if (result == null) {
		throw new ToBytesError(string, "bytelist", "String is not compatible with byte list regex")
	}

	for (m of result["groups"]["inner"].matchAll(BYTE_LIST_ELEMENT_REGEX)) {
		n = Number(m["groups"]["number"])
		if (n > 255 || isNaN(n)) {
			throw new ToBytesError(string, "byte list", "Byte list element is either not a u8 or not a valid number")
		}
		arr.push(n)
	}
	
	return arr
}

function datetime_to_bytes(string) {
	epoch = Date.parse(string)

	if (isNaN(epoch)) {
		throw new ToBytesError(string, "date", "String is not a valid date")
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
		throw new ToBytesError(string, "ipaddr", "String is not a valid UUID format")
	}
}

function _primitive_to_bytes(string, t) {
	n = Number(string)



	if (isNaN(n)) {
		throw new ToBytesError(string, "primitive", "Invalid primitive")
	}

	b = new t(1)
	b[0] = n


	return Array.from(new Uint8Array(b.buffer))
}

function i8_to_bytes(string) {
	return _primitive_to_bytes(string, Int8Array)
}

function i16_to_bytes(string) {
	return _primitive_to_bytes(string, Int16Array)
}

function i32_to_bytes(string) {
	return _primitive_to_bytes(string, Int32Array)
}

function i64_to_bytes(string) {
	try {
		n = BigInt(string)
	} catch (err) {
		throw new ToBytesError(string, "i64", String(err))
	}

	b = new BigInt64Array(1)
	b[0] = n


	return Array.from(new Uint8Array(b.buffer))
}

function u8_to_bytes(string) {
	return _primitive_to_bytes(string, Uint8Array)
}

function u16_to_bytes(string) {
	return _primitive_to_bytes(string, Uint16Array)
}

function u32_to_bytes(string) {
	return _primitive_to_bytes(string, Uint32Array)
}

function u64_to_bytes(string) {
	try {
		n = BigInt(string)
	} catch (err) {
		throw new ToBytesError(string, "u64", String(err))
	}

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
			throw new ToBytesError(string, "c escaped", "C escaped strings must only contain ascii characters")
		}
	}


	for (i = 0; i < s.length; i++) {
		char = s[i]
		code = s.charCodeAt(i)

		if (char == "\\") {
			identifier = s[i+1]

			if (identifier == "a") {
				output.push(0x07)
				output.push(0x00)
				i += 1
			} else if (identifier == "b") {
				output.push(0x08)
				output.push(0x00)
				i += 1
			} else if (identifier == "f") {
				output.push(0x0C)
				output.push(0x00)
				i += 1
			} else if (identifier == "n") {
				output.push(0x0A)
				output.push(0x00)
				i += 1
			} else if (identifier == "r") {
				output.push(0x0D)
				output.push(0x00)
				i += 1
			} else if (identifier == "t") {
				output.push(0x09)
				output.push(0x00)
				i += 1
			} else if (identifier == "v") {
				output.push(0x0B)
				i += 1
			} else if (identifier == "\\") {
				output.push(0x5C)
				output.push(0x00)
				i += 1
			} else if (identifier == "'") {
				output.push(0x27)
				output.push(0x00)
				i += 1
			} else if (identifier == "\"") {
				output.push(0x22)
				output.push(0x00)
				i += 1
			} else if (identifier == "x") {
				n = Number("0x" + s.slice(i+2, i+4))

				if (isNaN(n)) {
					throw new ToBytesError(string, "c escaped", "Invalid escape character: \\x escape did not contain a valid number")
				}

				output.push(n)
				i += 3
				
			} else if (identifier == "u") {
				high = Number("0x" + s.slice(i+2, i+4))
				low = Number("0x" + s.slice(i+4, i+6))

				if (isNaN(low) || isNaN(high) ) {
					throw new ToBytesError(string, "c escaped", "Invalid escape character: \\u escape did not contain a valid number")
				}

				output.push(low)
				output.push(high)
				i += 5
			} else if (identifier == "U") {
				throw "C Escaped: 'U' Not yet supported"
			} else {
				throw new ToBytesError(string, "c escaped", "Invalid escape character (" + identifier + ")")
			}

		} else {
			output.push(code)
		}

	}

	return output
}



