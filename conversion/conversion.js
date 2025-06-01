selected_type = null

// A Uint8Array representing the underlying type
bytes = null

reverse = false

escaped_map = new Map()	
raw_map = new Map()

const POSSIBLE_LIST_ID = "posiblity_list"
const INPUT_BOX_ID = "input"
const CONVERSIONS_CONTAINER_ID = "conversions"

const SEPARATOR = "__SEPARATOR__"

var $_GET = {};
var isNavigating = false;

//Courtesy of https://www.ideasandpixels.com/articles/get-post-variables-with-javascript/
document.location.search.replace(/\??(?:([^=]+)=([^&]*)&?)/g, function () {
    function decode(s) {
        return decodeURIComponent(s.split("+").join(" "));
    }

    $_GET[decode(arguments[1])] = decode(arguments[2]);
});

// Handle browser back/forward navigation
window.addEventListener('popstate', function(event) {
    isNavigating = true;
    // Clear and rebuild $_GET from the new URL
    $_GET = {};
    document.location.search.replace(/\??(?:([^=]+)=([^&]*)&?)/g, function () {
        function decode(s) {
            return decodeURIComponent(s.split("+").join(" "));
        }
        $_GET[decode(arguments[1])] = decode(arguments[2]);
    });
    // Update page based on new URL
    process_get();
    isNavigating = false;
});

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

function process_get() {

	input = ""
	reverse = false
	selected = ""

	clear_selection()

	if ("input" in $_GET) {
		input = $_GET["input"]

		

		if ("selected" in $_GET && input != "") {



			if ("reverse" in $_GET) {
				reverse = $_GET["reverse"] == "true" ? true : false
			}

			selected = $_GET["selected"]
		}
	}


	if (input != "") {
		document.getElementById(INPUT_BOX_ID).value = input


		display_possibles(null)

		if (selected != "") {
			display_conversions(selected)

			possibility_selected(selected)
		}
	}

}

function uploadfileDropHandler(ev) {
  console.log("File(s) dropped");

  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();

  f = null

  if (ev.dataTransfer.items) {
    // Use DataTransferItemList interface to access the file(s)
    [...ev.dataTransfer.items].forEach((item, i) => {
      // If dropped items aren't files, reject them
      if (item.kind === "file") {
        const file = item.getAsFile();
        f = file
      }
    });
  } else {
    // Use DataTransfer interface to access the file(s)
    [...ev.dataTransfer.files].forEach((file, i) => {
      f = file
    });
  }

  if (f != null) {

  	reader = new FileReader()

  	reader.readAsBinaryString(f);

	  reader.onload = function() {
	    sttring_result = reader.result

	    //Convert bytes to base64 string
			b64 = btoa(sttring_result)

	    //Insert base64 string into input box, clearing it first
	    document.getElementById(INPUT_BOX_ID).value = b64

	    //Select 'Base64' as the selected type
	    display_possibles("Base64")
	    display_conversions("Base64")
	  };
  }

}


function uploadfileDragOverHandler(ev) {
  console.log("File(s) in drop zone");

  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();
}

function copy_data(name) {
	navigator.clipboard.writeText(raw_map.get(name));
}


function get_unicode_name(code) {

	for (seg of UNICODE_INDICES_LIST) {
		seg_size = null

		if (seg.length > 1) {
			seg_size = seg.length - 1
		} else {
			seg_size = seg[0]
		}

		if (code < seg_size) {
			if (seg.length > 1) {
				return UNICODE_NAME_LIST.slice(seg[code], seg[code+1])
			} else {
				return "unknown"
			}
		}

		code = code - seg_size
	}
}

function adjust_rows() {

	document.getElementById(INPUT_BOX_ID).rows = 1

	rows = 1

	while (document.getElementById(INPUT_BOX_ID).offsetHeight < document.getElementById(INPUT_BOX_ID).scrollHeight && rows < 10) {

		document.getElementById(INPUT_BOX_ID).rows = rows
		rows = rows + 1
	}
}

function display_possibles(optional_type) {

	adjust_rows()

	selected_type = null

  document.getElementById(CONVERSIONS_CONTAINER_ID).innerHTML = "";

  text = document.getElementById(INPUT_BOX_ID).value

  if (optional_type == null) {
  	input = possibilities(text);
	} else {
		input = [optional_type]
	}

	document.getElementById(CONVERSIONS_CONTAINER_ID).style.backgroundColor  = "#292d33"

	if (text != "") {
  	document.getElementById(POSSIBLE_LIST_ID).innerHTML = "<hr>";
	} else {
		document.getElementById(POSSIBLE_LIST_ID).innerHTML = ""
	}

  for (p of input)
  {
    document.getElementById(POSSIBLE_LIST_ID).innerHTML += "<h6 id=\"" + p + "\" style=\"cursor:default\" onmouseover=\"highlight('" + p + "')\" onclick=\"possibility_selected('" + p + "')\">" + p + "</h6>";
  }
    
	reverse = false

	if (!isNavigating) {
		if (text != "") {
			window.history.pushState("object or string", "Title", "?input=" + encodeURIComponent(text));
		} else {
			window.history.pushState("object or string", "Title", "?");
		}
	}
    
}

// Used to clear the input box
function clear_selection() {

    document.getElementById(INPUT_BOX_ID).value = "";

    display_possibles(null)
}

function remove_whitespace() {

	input = document.getElementById(INPUT_BOX_ID)
	val = input.value;

	input.value = val.replace(/\s/g, '')

  display_possibles(null)
}

function reverse_show() {

	if (selected_type != null) {
		reverse = true

		display_conversions(selected_type)


		window.history.pushState("object or string", "Title", "?input=" + encodeURIComponent(document.getElementById(INPUT_BOX_ID).value) + "&reverse=" + reverse + "&selected=" + encodeURIComponent(selected_type));


	}

}

function see_less(tag) {
	content = document.getElementById("content_" + tag)

	content.innerHTML = escaped_map.get(tag).slice(0, 200) + '<div><a style="cursor:pointer" onclick="see_more(\'' + tag + '\')">See more...</a></div>'

	content.scrollIntoView()
}

function see_more(tag) {
	content = document.getElementById("content_" + tag)

	content.innerHTML = escaped_map.get(tag) + '<div><a style="cursor:pointer" onclick="see_less(\'' + tag + '\')">See less.</a></div>'

	content.scrollIntoView()
}

function click_download() {
	// Compute a unique hash for the bytes and type
	let type = selected_type ? selected_type[0] : "unknown";
	let hash_input = new Uint8Array(bytes.length + type.length);
	hash_input.set(bytes, 0);
	for (let i = 0; i < type.length; i++) {
		hash_input[bytes.length + i] = type.charCodeAt(i);
	}
	// Use _sha256 from sha256.js (assumed to be loaded globally)
	let hash = typeof _sha256 === 'function' ? _sha256(hash_input) : "hash";
	// Format the hash with a '-' after every 10 characters
	let formatted_hash = hash.replace(/(.{6})/g, '$1-').replace(/-$/, '');
	let truncated_hash = formatted_hash.slice(0, 31);
	let filename = `5b-${truncated_hash}.bin`;

	const blob = new Blob([bytes], {type: 'application/octet-stream'});
	const bytes_file_URL = URL.createObjectURL(blob);

	const downloadLink = document.createElement('a');
	downloadLink.href = bytes_file_URL;
	downloadLink.download = filename;
	downloadLink.setAttribute('data-hash', hash);
	document.body.appendChild(downloadLink);
	downloadLink.click();

	URL.revokeObjectURL(bytes_file_URL);
}


function display_conversions(possibility) {



	for (possible_type of POSSIBLE_TYPES) {
		if (possibility === possible_type[0]) {
			selected_type = possible_type
		}
	}

	bytes = selected_type[1](document.getElementById(INPUT_BOX_ID).value)

	raw_map.clear()
	escaped_map.clear()


	table = '<div class="u-align-center u-table u-table-responsive u-table-2"><table style="table-layout: fixed; width: 100%" ><colgroup><col width="25.87%"><col width="70.13%"></colgroup><tbody class="u-table-body">'

	draw_line = false

	var count = 0

	for (conversion_type of CONVERSION_TYPES) {
		name = conversion_type[0]
		func = conversion_type[1]
		pad_to = conversion_type[2]


		shortened = false

		if (conversion_type.length == 1 && conversion_type[0] == SEPARATOR) {

			table += '</tbody></table></div>'

			table += '<div class="u-align-center u-table u-table-responsive u-table-2"><table style="table-layout: fixed; width: 100%" ><colgroup><col width="25.87%"><col width="70.13%"></colgroup><tbody class="u-table-body">'

			if (draw_line) {
				table += '<hr>'
				draw_line = false
			}
		} else {
			try {

				if (selected_type[2] == true && pad != null) {

					converted = func(reverse_bytes(pad(bytes, pad_to)))
				} else {
					converted = func(reverse_bytes(bytes))
				}


				raw_map.set(name, converted)
			
				escaped = escapeHTML(converted)

				if (name == "24-bit color" || name == "16-bit color") {
					inner = "<div style='color:" + escaped + "'><h1>&#9632</h1></div>"
				} else if (name == "Download") {

					

					inner = "<div><a style='cursor:pointer' onclick='click_download()'>Download</a></div>"
				} else {
					inner = escaped
				}

				escaped_map.set(name, inner)

				if (inner.length > 200) {
					inner = inner.slice(0, 200)
					shortened = true
				}

				var alternate

				if (count % 2 == 0) {
					alternate = ""
				} else {
					alternate = "background-color:#656d7a"
				}

				if (shortened) {
					elipse = '<div><a style="cursor:pointer" onclick="see_more(\'' + name + '\')">See more...</a></div>'
				} else {
					elipse = ""
				}

				table += '<tr style="height: 45px; ' + alternate + '"><td class="u-table-cell">' + name + '</td><td id="content_' + name + '" style="overflow-wrap:break-word" class="u-align-right u-table-cell u-text-palette-1-light-1 u-table-cell-8">' + inner + elipse + '</td><td class="u-table-cell copy-icon-cell" style="width:48px;"><img src="./images/copy.png" style="cursor:pointer;display:block;margin:0 auto;" onclick=\'copy_data("' + name + '")\'></td></tr>'

				draw_line = true

				count += 1
			} catch (err) {

				//A FromBytesError is fine, it means we cannot convert from that type, so we don't. Any other type of error however is not recoverable
				if (err instanceof FromBytesError) {
					//console.log("bytes error: " + err)
				} else {
					console.log("generic error (" + name + "): " + err)
					throw err
				}

			}
		}

		
	}

	table += '</tbody></table></div>'

	conversions_container = document.getElementById(CONVERSIONS_CONTAINER_ID)

	conversions_container.innerHTML = table

	conversions_container.scrollIntoView()

	document.getElementById(CONVERSIONS_CONTAINER_ID).style.backgroundColor  = "#555c66"
}

//Called when the onclick even is raised in the items in the possibilities list
function possibility_selected(possibility) {

	reverse = false

	display_conversions(possibility)

	highlight(possibility)

	if (!isNavigating) {
		window.history.pushState("object or string", "Title", "?input=" + encodeURIComponent(document.getElementById(INPUT_BOX_ID).value) + "&reverse=" + reverse + "&selected=" + encodeURIComponent(possibility));
	}

   	
}

//Highlight the ID and remove the highlight from all other entries
function highlight(id) {
	const highlight_color = "#848c99";
	const non_highlight_color = "#555c66";

	p_list = document.getElementById(POSSIBLE_LIST_ID)

	for (child of p_list.children) {
		child.style.backgroundColor = non_highlight_color
	}

	if (selected_type != null) {
		document.getElementById(selected_type[0]).style.backgroundColor = '#656d7a'
	}

	document.getElementById(id).style.backgroundColor = highlight_color

}

//Reverse the bytes, only if the endianness requires it though
function reverse_bytes(bytes) {
	if (reverse) {


		a = new Uint8Array(bytes.length)

		for (i = 0; i < bytes.length; i++) {
			a[i] = bytes[bytes.length - i - 1]
		}

		return a

	} else {
		return bytes
	}
}

//Add padding zero bytes to array up to 'to' bytes
function pad(bytes, to) {


	if (bytes.length < to) {
		copy = new Uint8Array(to)

		for (i=0; i < bytes.length; i++) {
			copy[i] = bytes[i]
		}

		return copy
	} else {
		return bytes
	}
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

				if (err instanceof ToBytesError) {
					//console.log("bytes error: " + err)
				} else {
					console.log("generic error (" + name + "): " + err)
					throw err
				}

			}
		}

	}

	return results
}

