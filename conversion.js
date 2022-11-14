
selected_type = null

// A Uint8Array representing the underlying type
bytes = null

const POSSIBLE_LIST_ID = "posiblity_list"
const INPUT_BOX_ID = "input"
const CONVERSIONS_CONTAINER_ID = "conversions"

// Courtesy of https://www.30secondsofcode.org/js/s/escape-html
const escapeHTML = str =>
  str.replace(
    /[&<>'"]/g,
    tag =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
  );

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

			table += '<tr style="height: 45px;"><td class="u-table-cell">' + name + '</td><td class="u-align-right u-table-cell u-text-palette-1-light-1 u-table-cell-8">' + escapeHTML(converted) + '</td></tr>'
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

