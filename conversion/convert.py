
# Python script to convert unicode name list into a more readable style for JS.
# List from https://github.com/progval/unicode_names2

unicode_text = "unicode_names.txt"
unicode_names = "unicode_names.js"
unicode_indices = "unicode_indices.js"

index = 0

count = 0

thing = [[0, 4, 20, 33, 44, 63, 70, 81, ], [8], [81, 89, 105, 123, ], [1], [123, 143, ]]
stuff = "NULLSTART OF HEADINGSTART OF TEXTEND OF TEXTEND OF TRANSMISSIONENQUIRYACKNOWLEDGESHIFT INDATA LINK ESCAPEDEVICE CONTROL ONEDEVICE CONTROL THREE"

def get_ith(i):
	for seg in thing:
		seg_size = seg.__len__() - 1 if seg.__len__() > 1 else seg[0]

		if i < seg_size:
			if seg.__len__() > 1:
				return stuff[slice(seg[i], seg[i+1])]
			else:
				return None

		i = i - seg_size

for i in range(20):
	print(get_ith(i))


with open(unicode_indices, "wt") as i_file:

	i_file.write("UNICODE_INDICES_LIST = [[0, ")

	with open(unicode_names, "wt") as n_file:

		n_file.write("UNICODE_NAME_LIST = \"")

		with open(unicode_text, "rt") as t_file:
			while True:

				line = t_file.readline()

				if (line == ""):
					break

				items = line.split(';')

				if (count != int(items[0], 16)):

					diff = int(items[0], 16) - count

					i_file.write("], [" + str(diff) + "], [" + str(index) + ", ")
					print(int(items[0], 16) - count)
					for i in range(diff):
						#i_file.write(str(index) + ", ")
						count += 1
				

				name = items[10] if items[1] == "<control>" else items[1]

				n_file.write(name)

				index += name.__len__()

				i_file.write(str(index) + ", ")

				count += 1



		n_file.write("\"")

	i_file.write("]]")


