
module ApiKeyLoader {
    var data
    var apiKeysDir = require('path').dirname(require.main.filename) + '/API_KEYS.json';

    function testValidity(data: any, apiKeyName: string) {
        if (!data[apiKeyName]) {
            throw new Error("No apiKey found for " + apiKeyName + ". Make sure to put a API_KEYS.json in the your app's main module -- " + apiKeysDir)
        }
    }
    export function setApiKeyPath(path: string) {
        apiKeysDir = (path + '/API_KEYS.json').replace(/\/\//, '/')
    }

    export function service(apiKeyName: string, resolve: (result: string) => void, reject?: (error: Error) => void) {
        if (!data) {
            require('fs').readFile(apiKeysDir, 'utf8', function(error: Error, strData: string) {
                if (error && reject) {
                    reject(error)
                }
                try {
                    data = JSON.parse(strData)
                    testValidity(data, apiKeyName)
                    resolve(data[apiKeyName])
                } catch (e) {
                    testValidity({}, apiKeyName)
                }
            })
        } else {
            testValidity(data, apiKeyName)
            resolve(data[apiKeyName])
        }
    }
}
