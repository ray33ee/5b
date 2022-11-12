

selected_type = null

// A Uint8Array representing the underlying type
bytes = null

const BYTE_LIST_REGEX = /\[(?<inner>(?:(?:0[obx])?[0-9A-Fa-f]+,)*(?:0[obx])?[0-9A-Fa-f]+,?)\]/
const BYTE_LIST_ELEMENT_REGEX = /(?<number>(?:0[obx])?[0-9A-Fa-f]+),?/g

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

];

const CONVERSION_TYPES = [
	["Base 10", bytes_to_base10],
	["Base 2", bytes_to_base2],
	["Base 8", bytes_to_base8],
	["Base 16", bytes_to_base16],
	["Base64", bytes_to_base64],
	["String", bytes_to_string],
	["Byte List", bytes_to_bytelist],
	["URL encode", bytes_to_urlencode],
	["IPv4", bytes_to_ipv4],
	["IPv6", bytes_to_ipv6],
	["Unix time", bytes_to_unix],
	["ISO 8601", bytes_to_unixiso],
	["Double float", bytes_to_f64],
	["Single float", bytes_to_f32],
];

const POSSIBLE_LIST_ID = "posiblity_list"
const INPUT_BOX_ID = "input"
const CONVERSIONS_CONTAINER_ID = "conversions"

function display_possibles() {

    document.getElementById(CONVERSIONS_CONTAINER_ID).innerHTML = "";

    input = possibilities(document.getElementById(INPUT_BOX_ID).value);

    document.getElementById(POSSIBLE_LIST_ID).innerHTML = "";
    for (p of input)
    {
      document.getElementById(POSSIBLE_LIST_ID).innerHTML += "<h6 id=\"" + p + "\" onmouseover=\"highlight('" + p + "')\" onclick=\"possibility_selected('" + p + "')\">" + p + "</h6>";
    }
    
}

// Used to clear the input box
function clear_selection() {

    document.getElementById(INPUT_BOX_ID).value = "";

    document.getElementById(POSSIBLE_LIST_ID).innerHTML = "";

    document.getElementById(CONVERSIONS_CONTAINER_ID).innerHTML = "";
}

//Called when the onclick even is raised in the items in the possibilities list
function possibility_selected(possibility) {

	for (possible_type of POSSIBLE_TYPES) {
		if (possibility === possible_type[0]) {
			selected_type = possible_type
		}
	}

	bytes = selected_type[1](document.getElementById(INPUT_BOX_ID).value)

	table = '<div class="u-align-center u-table u-table-responsive u-table-2"><table style="table-layout: fixed; width: 100%" ><colgroup><col width="29.87%"><col width="70.13%"></colgroup><tbody class="u-table-body">'

	for (conversion_type of CONVERSION_TYPES) {
		name = conversion_type[0]
		func = conversion_type[1]

		try {
			converted = func(bytes)

			table += '<tr style="height: 45px;"><td class="u-table-cell">' + name + '</td><td class="u-align-right u-table-cell u-text-palette-1-light-1 u-table-cell-8">' + converted + '</td></tr>'
		} catch (err) {

		}
	}

	table += '</tbody></table></div>'

	document.getElementById(CONVERSIONS_CONTAINER_ID).innerHTML = table
  	
}

//Highlight the ID and remove the highlight from all other entries
function highlight(id) {
	const highlight_color = "#000000";
	const non_highlight_color = "#555c66";

	p_list = document.getElementById(POSSIBLE_LIST_ID)

	for (child of p_list.children) {
		child.style.backgroundColor = non_highlight_color
	}


	document.getElementById(id).style.backgroundColor = highlight_color

}

//Add padding zero bytes to array up to 'to' bytes
function pad_to(array, to) {
	a = array
	if (a.length < to) {
		diff = to - a.length
		for (i = 0; i < diff; i++) {
			a.push(0)
		}
	}

	return a
}

//A list of conversions from string to Uint8Array by possible types
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

	return new Date(Number(big))
}

function bytes_to_unixiso(bytes) {
	big = _bytes_to_bigint(bytes)

	return new Date(Number(big)).toISOString()
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

//Get a list of all possible types for the given string
function possibilities(string) {

	results = []

	if (string != "") {
		
		for (possible_type of POSSIBLE_TYPES) {
			name = possible_type[0]
			func = possible_type[1]

			try {
				func(string)

				results.push(name)
			} catch (err) {

			}
		}

	}

	return results
}

