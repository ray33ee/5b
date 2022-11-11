

selected_type = null

// A Uint8Array representing the underlying type
bytes = null

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

];

const CONVERSION_TYPES = [
	["Base64", bytes_to_base64],
	["Base 2", bytes_to_base2],
	["Base 8", bytes_to_base8],
	["Base 10", bytes_to_base10],
	["Base 16", bytes_to_base16],
	["String", bytes_to_string],
	["Byte List", bytes_to_bytelist],
	["URL encode", bytes_to_urlencode]
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

//A list of conversions from string to Uint8Array by possible types
function base64_to_bytes(string) {

	decode = atob(string)

	array = []

	for (byte of decode) {
		array.push(byte.charCodeAt(0))
	}

	return array; ///"WIP"; //string_to_bytes(atob(string)) // atob converts Base64 to a byte array in string form, then to_string converts the string form into Uint8Array
}

function integer_to_bytes(string) {
	i = BigInt(string)

	if (i == 0n) {
		return [0]
	}

	array = []

	while (i != 0n) {
		array.push(Number(i % 256n))
		i = i >> 8n
	}

	return new Uint8Array(array)
}

function string_to_bytes(string) {
	string = utf8.encode(string)
	array = []

	for (char of string) {
		array.push(char.charCodeAt(0))
	}

	return new Uint8Array(array)
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

	return new Uint8Array(f64_arr.buffer)
}

function f32_to_bytes(string) {
	f = Number(string)

	if (isNaN(f) && string != "NaN") {
		throw "Cannot convert string to f64"
	}

	var f32_arr = new Float32Array(1);
	f32_arr[0] = f;

	return new Uint8Array(f32_arr.buffer)
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

