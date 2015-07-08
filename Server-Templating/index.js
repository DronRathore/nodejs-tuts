var config = require("./config")
var http = require("http")
var fs = require("fs")
var path = require("path")
/*
	fs.readFile
	fs.writeFile
	fs.createReadStream
	fs.createWriteStream
	fs.exists
		/mera-folder
		/mera-folder/ [default.html, index.html]
		/mera-folder/merifile.txt

*/

var templateFile = fs.readFileSync("./index.html").toString()




http.createServer(function(request, response){
	//var file_name = "."+ request.url + ".txt"
	var file_name = "." + request.url
	file_name = path.resolve(config.publicPath, file_name)
	console.log("File Name", file_name)

	if (request.url.lastIndexOf("/") == request.url.length-1 ){
		// Looking into the folder
		var fileData;
		if (fileData = getFile(file_name + "index.html")){
			// 200 file mil gayi
			var options = {
				content: fileData
			}
			return send200(options, response)
		} else if (fileData = getFile(file_name + "default.html")){
			var options = {
				content: fileData
			}
			return send200(options, response)
		} else {
			return send404(response)
		}
	} else {
		// look for folder
		var files = getDir(file_name)
		if (files != 0 && files != -1){
			// this is a directory
			var options = {
				list: files,
				current_path: request.url
			}
			return send200(options, response)
		
		} else if (files == -1){
			// check whether this file exists
			var fileData;
			if (fileData = getFile(file_name)){
				var options = {
					content: fileData
				}
				return send200(options, response)
			} else {
				// neither a file nor a directory
				return send404(response)
			}
		} else {
			// neither a file nor a directory
			return send404(response)
		}
	}

}).listen(config.port)

function send404(response){
	response.writeHead(404, {"Content-Type": "text/html"})
	return response.end()
}
function send200(data, response){
	response.writeHead(200, {"Content-Type": "text/html"})
	response.write(blockCompiler(data))
	response.end()
}
function getFile(path){
	if (fs.existsSync(path)){
		try{
			return fs.readFileSync(path)
		} catch(e){
			return false
		}
	}
}
function getDir(path){
	if (fs.existsSync(path)){
		// read directory
		try{
			return fs.readdirSync(path)
		} catch(e){
			return -1
		}
	} else {
		return 0
	}
}

function compileVariable(string, options){
	var _options = options;
	var compiled = string.replace(/(?:(?:\#\{))([A-Za-z_0-9]*)(?:(?:\}))/gmi, function(total, group, index){
		if (_options[group]){
			return _options[group]
		} else {
			return ""
		}
	})
	return compiled;
}

function blockCompiler(options){
	var _options = options
	var compiled = templateFile.replace(/(block)\(((.*)\,\s*(.*))\)\{(.*[\S\s]*)\}/gmi, function($1, $2, $3, variable_name, iterator_var, inner_template){
		var iterator = _options[variable_name];
		if (iterator){
			var data = "";
			for (var i=0; i<iterator.length; i++){
				var options = {}
				options[iterator_var] = iterator[i]
				options = extendOptions(_options, options)
				data += compileVariable(inner_template, options)
			}
			return data;
		} else {
			return ""
		}
	})
	return compileVariable(compiled, options);
}
function extendOptions(globalOptions, local){
	for(opt in globalOptions){
		local[opt] = globalOptions[opt]
	}
	return local;
}