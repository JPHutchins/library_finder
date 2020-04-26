"""Generate the CSS and JS files to be included in binary."""

char_limit = 16300
n_script_strings = 4  # Split JS into 4 strings for MSVC compiler

print("Making style.h ...")

css_in = open("./library_explorer/style.css")
css_string = css_in.read()
css_in.close()
print("CSS input is {} characters long".format(len(css_string)))

css_out = open("./library_finder/style.h", "w")

css_out.write("R\"=====(<style>{}</style>)=====\"".format(css_string))
css_out.close()
print("style.h success")

print("Making script(s).h ...")

js_in = open("./library_explorer/script.js")
js_string = js_in.read()
js_in.close()
js_string_len = len(js_string)
print("JS input is {} characters long".format(js_string_len))

n = 1  # start at script_1.h
i = 0  # start at index 0 of the string
while n <= n_script_strings:
    c = 0  # init character counter
    js_out = open("./library_finder/script_{}.h".format(n), "w")
    js_out.write("R\"=====(")
    if n == 1:  # open script tag on first file
        js_out.write("<script>")  
    while c < char_limit:
        if i >= js_string_len:
            break
        js_out.write(js_string[i])
        c += 1  # count characters written
        i += 1
    if n == n_script_strings:
        js_out.write("</script>")
    js_out.write(")=====\"")
    print("script_{}.h success".format(n))
    n += 1

print("Pre-compile success")