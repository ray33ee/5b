
selected_type = null

// A Uint8Array representing the underlying type
bytes = null

// Here we create a possible type map from name to conversion function.
// Note: The order of this list is important as it is designed such that the more used conversions are listed first.
// Since dictionaries aren't guaranteed to preserve order, a list of pairs is used instead 
const POSSIBLE_TYPES = [
	["Base64", to_base64],
	["Integer", to_integer],
	["String", to_string],
];

const CONVERSION_TYPES = [];

const POSSIBLE_LIST_ID = "posiblity_list"
const INPUT_BOX_ID = "input"
const CONVERSIONS_CONTAINER_ID = "conversions"

function display_possibles() {




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
}

//Called when the onclick even is raised in the items in the possibilities list
function possibility_selected(possibility) {


	for (possible_type of POSSIBLE_TYPES) {
		if (possibility === possible_type[0]) {
			selected_type = possible_type
		}
	} 

	bytes = selected_type[1](document.getElementById(INPUT_BOX_ID).value)

	console.log(bytes)

  	
    conversions()
}

//Add all conversions to the page
function conversions() {
	const str = '<div class="u-align-center u-table u-table-responsive u-table-2"><table style="table-layout: fixed; width: 100%" ><colgroup><col width="29.87%"><col width="70.13%"></colgroup><tbody class="u-table-body"><tr style="height: 45px;"><td class="u-table-cell">Binary</td><td class="u-align-right u-table-cell u-text-palette-1-light-1 u-table-cell-8">1000000000000100100</td></tr><tr style="height: 48px;"><td class="u-table-cell">Octal</td><td class="u-align-right u-table-cell u-text-palette-1-light-1">700</td></tr><tr style="height: 45px;"><td class="u-table-cell">Decimal</td><td class="u-align-right u-table-cell u-text-palette-1-light-1">10</td></tr></tbody></table></div><div class="u-align-center u-border-3 u-border-palette-5-light-1 u-expanded-width u-line u-line-horizontal u-line-2"></div>'
	document.getElementById(CONVERSIONS_CONTAINER_ID).innerHTML += str
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
function to_base64(string) {
	return to_string(atob(string)) // atob converts Base64 to a byte array in string form, then to_string converts the string form into Uint8Array
}

function to_integer(string) {
	i = BigInt(string)

	array = []

	while (i != 0n) {
		array.push(Number(i % 256n))
		i = i >> 8n
	}

	return new Uint8Array(array)
}

function to_string(string) {
	array = []

	for (char of string) {
		array.push(char.charCodeAt(0))
	}

	return new Uint8Array(array)
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

