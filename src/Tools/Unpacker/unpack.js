
// var JavascriptObfuscator = require('./javascriptobfuscator_unpacker.js')
var AADecoder = require('./AADecoder')
var MyObfuscate = require('./myobfuscate_unpacker.js')
var P_A_C_K_E_R = require('./p_a_c_k_e_r_unpacker.js')
var Urlencoded = require('./urlencode_unpacker.js')

var unpack = function(){
	this.unpack = function(source)
	{
		var trailing_comments = '',
                comment = '',
                unpacked = '',
                found = false;

        // cut trailing comments
        do {
            found = false;
            if (/^\s*\/\*/.test(source)) {
                found = true;
                comment = source.substr(0, source.indexOf('*/') + 2);
                source = source.substr(comment.length).replace(/^\s+/, '');
                trailing_comments += comment + "\n";
            } else if (/^\s*\/\//.test(source)) {
                found = true;
                comment = source.match(/^\s*\/\/.*/)[0];
                source = source.substr(comment.length).replace(/^\s+/, '');
                trailing_comments += comment + "\n";
            }
        } while (found);

        var unpackers = [AADecoder, P_A_C_K_E_R, Urlencoded, /*JavascriptObfuscator,*/ MyObfuscate];
        for (var i = 0; i < unpackers.length; i++) {
            if (unpackers[i].detect(source)) {
                unpacked = unpackers[i].unpack(source);
                if (unpacked != source) {
                    source = this.unpack(unpacked);
                }
            }
        }

        return trailing_comments + source;
	}
}

module.exports = new unpack()
