

const BYTE_LIST_REGEX = /\[?(?<inner>(?:(?:0[obx])?[0-9A-Fa-f]+,)*(?:0[obx])?[0-9A-Fa-f]+,?)\]?/
const BYTE_LIST_ELEMENT_REGEX = /(?<number>(?:0[obx])?[0-9A-Fa-f]+),?/g

const UUID_REGEX = /[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}/
const HTML_COLOR_REGEX = /[#](?<code>[0-9A-Fa-f]{6})/
const RGB_COLOR_REGEX = /[rR][gG][bB]\((?<red>[0-9]+),(?<green>[0-9]+),(?<blue>[0-9]+)\)/
const HSV_COLOR_REGEX = /[hH][sS][vV]\((?<hue>[0-9]+),(?<saturation>[0-9]+),(?<value>[0-9]+)\)/

// Here we create a possible type map from name to conversion function.
// Note: The order of this list is important as it is designed such that the more used conversions are listed first.
// Since dictionaries aren't guaranteed to preserve order, a list of pairs is used instead 
const POSSIBLE_TYPES = [
	["Integer", integer_to_bytes, true],
	["Binary", base2_to_bytes, true],
	["Octal", base8_to_bytes, true],
	["Hexadecimal", base16_to_bytes, true],
	["UTF-8 String", uft8string_to_bytes, false],
	["UTF-16 String", utf16string_to_bytes, false],
	["Base64", base64_to_bytes, false],
	["Base85", base85_to_bytes, false],
	["Base91", base91_to_bytes, false],
	["Double float", f64_to_bytes, false],
	["Single float", f32_to_bytes, false],
	["URL Decode", urldecode_to_bytes, false],
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
	["HTML color", htmlcolor_to_bytes, true],
	["RGB color", rgbcolor_to_bytes, true],
	["HSV color", hsvcolor_to_bytes, true],
	["Color Name", colorname_to_bytes, false],
	["C Escaped", c_escaped_to_bytes, false],

];


function base64_to_bytes(string) {

	for (char of string) {
		code = char.charCodeAt(0)
		if (!((code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122) || code == 43 || code == 47 || code == 61)) {
			throw new ToBytesError(string, "base64", "Invalid base64 character")
		}
	}

	try {
		decode = atob(string)
	} catch (err) {
		throw new ToBytesError(string, "base64", String(err))
	}

	array = new Uint8Array(decode.length)

	view = new DataView(array.buffer)

	for (i=0;i<decode.length;i++) {
		view.setUint8(i, decode[i].charCodeAt(0))
	}

	return array;
}

function base91_to_bytes(string) {
	try {
		decode = base91.decode(string)
	} catch (err) {
		throw new ToBytesError(string, "base91", String(err))
	}

	array = new Uint8Array(decode.length)

	view = new DataView(array.buffer)

	for (i=0;i<decode.length;i++) {
		view.setUint8(i, decode[i].charCodeAt(0))
	}

	return array;
}

function base85_to_bytes(string) {

	try {
		arr = ascii85.toByteArray(string)
	} catch (err) {
		throw new ToBytesError(string, "base85", String(err))
	}

	if (arr.length == 0) {
		throw new ToBytesError(string, "base85", "Invalid base85 string")
	}

	return arr
}

function integer_to_bytes(string) {
	try {
		i = BigInt(string)
	} catch (err) {
		throw new ToBytesError(string, "bigint", String(err))
	}

	if (i == 0n) {
		return new Uint8Array([0])
	}

	if (i < 0n) {
		throw new ToBytesError(string, "bigint", "Big int cannot be used for negative numbers, as fixed width primitives should be used instead (i8, i16, etc.)")
	}

	array = []

	while (i != 0n) {
		array.push(Number(i % 256n))
		i = i >> 8n
	}

	return new Uint8Array(array)
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
	array = new Uint8Array(string.length * 2)

	view = new DataView(array.buffer)

	for (i=0;i<string.length;i++) {
		view.setUint16(i*2, string[i].charCodeAt(0), true)
	}

	return array
}

function uft8string_to_bytes(string) {
	return new TextEncoder().encode(string)
}

function urldecode_to_bytes(string) {

	try {
		d = decodeURIComponent(string)
	} catch (err) {
		throw new ToBytesError(string, "url decode", err)
	}
	return uft8string_to_bytes(d)
}

function f64_to_bytes(string) {
	return _generic_primitive_to_bytes(string, Number, "Float64", 8)
}

function f32_to_bytes(string) {
	return _generic_primitive_to_bytes(string, Number, "Float32",  4)
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
	
	return new Uint8Array(ipaddr.parse(string).toByteArray())
}

function bytelist_to_bytes(string) {
	s = string.replace(/\s/g, '')

	result = BYTE_LIST_REGEX.exec(s)

	arr = []

	if (result == null) {
		throw new ToBytesError(s, "bytelist", "String is not compatible with byte list regex")
	}

	for (m of result["groups"]["inner"].matchAll(BYTE_LIST_ELEMENT_REGEX)) {
		n = Number(m["groups"]["number"])
		if (n > 255 || isNaN(n)) {
			throw new ToBytesError(s, "byte list", "Byte list element is either not a u8 or not a valid number")
		}
		arr.push(n)
	}
	
	return new Uint8Array(arr)
}

function datetime_to_bytes(string) {

	parsed = Date.parse(string)

	if (isNaN(parsed)) {
		throw new ToBytesError(string, "date/time", "String is not a valid or supported date/time format")
	}

	return u64_to_bytes(BigInt(parsed))

}

function uuid_to_bytes(string) {
	if (UUID_REGEX.test(string)) {
		s = string.replace(/-/g, '')

		return base16_to_bytes(s)
	} else {
		throw new ToBytesError(string, "ipaddr", "String is not a valid UUID format")
	}
}



function _generic_primitive_to_bytes(string, func, t, size) {
	try {
		n = func(string)
	} catch (err) {
		throw new ToBytesError(string, "primitive", String(err))
	}

	if (typeof(n) !== "bigint") {
		if (isNaN(n) && string != "NaN") {
			throw new ToBytesError(string, "primitive", "Invalid primitive")
		}
	}

	b = new Uint8Array(size)

	v = new DataView(b.buffer)

	v["set" + t](0, n, true)

	//Convert the bytes back into a string and compare with original. This allows us to rule out putting large numbers in small primitives (700 does not fit in u8 for example)
	if (String(v["get" + t](0, true)) != string) {
		throw new ToBytesError(string, "primitive", "Primitive overflow")
	}

	return b
}

function _primitive_to_bytes(string, t, size) {
	return _generic_primitive_to_bytes(string, Number, t, size)
}

function _big_primitive_to_bytes(string, t) {
	return _generic_primitive_to_bytes(string, BigInt, t, 8)
}

function i8_to_bytes(string) {
	return _primitive_to_bytes(string, "Int8", 1)
}

function i16_to_bytes(string) {
	return _primitive_to_bytes(string, "Int16", 2)
}

function i32_to_bytes(string) {
	return _primitive_to_bytes(string, "Int32", 4)
}

function i64_to_bytes(string) {
	return _big_primitive_to_bytes(string, "BigInt64")
}

function u8_to_bytes(string) {
	return _primitive_to_bytes(string, "Uint8", 1)
}

function u16_to_bytes(string) {
	return _primitive_to_bytes(string, "Uint16", 2)
}

function u32_to_bytes(string) {
	return _primitive_to_bytes(string, "Uint32", 4)
}

function u64_to_bytes(string) {
	return _big_primitive_to_bytes(string, "BigUint64")
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

				for (j=8; j>=2; j-=2) {
					n = Number("0x" + s.slice(i+j, i+j+2))

					if (isNaN(n)) {
						throw new ToBytesError(string, "c escaped", "Invalid escape character: \\U escape did not contain a valid number")
					}

					output.push(n)
				}

				i += 9

			} else {
				throw new ToBytesError(string, "c escaped", "Invalid escape character (" + identifier + ")")
			}

		} else {
			output.push(code)
		}
 	}

	return new Uint8Array(output)
}

function htmlcolor_to_bytes(string) {
	result = HTML_COLOR_REGEX.exec(string)
	
	if (result == null) {
		throw new ToBytesError(string, "html color", "Does not match html color regex")
	} else {
		return new Uint8Array(u32_to_bytes(Number("0x" + result["groups"]["code"])).buffer.slice(0,3))
	}
}

function rgbcolor_to_bytes(string) {
	s = string.replace(/\s/g, '')

	result = RGB_COLOR_REGEX.exec(s)



	
	if (result == null) {
		throw new ToBytesError(s, "rgb color", "Does not match html color regex")
	} else {
		cols = ["blue", "green", "red"]
		bytes = []

		for (col of cols) {
			n = Number(result["groups"][col])

			if (!isNaN(n) && n <= 255 && n >= 0) {
				bytes.push(n)
			} else {
				throw new ToBytesError(s, "rgb color", "RGB value is not a valid u8")
			}
		}

		return new Uint8Array(bytes)
	}
}

function hsvcolor_to_bytes(string) {

	s = string.replace(/\s/g, '')

	result = HSV_COLOR_REGEX.exec(s)

	if (result == null) {
		throw new ToBytesError(s, "hsv color", "Does not match hsv format")
	}

	h = Number(result["groups"]["hue"])
	s = Number(result["groups"]["saturation"]) / 100.0
	v = Number(result["groups"]["value"]) / 100.0

	c = v * s

	h2 = h / 60

	x = c * (1 - Math.abs(h2 % 2 - 1))

	m = v - c

	switch (Math.floor(h2)) {
		case 0:
			r = c + m
			g = x + m
			b = m
			break;
		case 1:
			r = x + m
			g = c + m
			b = m
			break;
		case 2:
			r = m
			g = c + m
			b = x + m
			break;
		case 3:
			r = m
			g = x + m
			b = c + m
			break;
		case 4:
			r = x + m
			g = m
			b = c + m
			break;
		case 5:
			r = c + m
			g = m
			b = x + m
			break;
	}

	bytes = []

	bytes.push(b*255)
	bytes.push(g*255)
	bytes.push(r*255)

	return new Uint8Array(bytes)
}

function colorname_to_bytes(string) {

	// Strip whitespace and force lower case
	cleaned = string.toLowerCase().replace(/\s/g, "")

	// Binary search 'COLOR_NAMES' list for name

	start = 0
	end = COLOR_NAMES.length-1

	timeout = 100

	while (true) {

		mid = Math.floor((end + start)/2)

		if (cleaned < COLOR_NAMES[mid]) {
			end = mid
		} else {
			start = mid
		}

		if (end == start + 1 || timeout == 0) {
			break
		}

		timeout -= 1
	}


	seg = COLOR_NAMES[start+1].split('#')

	if (cleaned == seg[0]) {

		return htmlcolor_to_bytes("#" + seg[1])
	} else {
		throw new ToBytesError(cleaned, "color name", "Color name is not a valid u8")
	}


	
}

