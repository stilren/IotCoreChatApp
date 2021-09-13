'use strict'
const predefinedPassword = process.env['PASSWORD']

exports.handler = async function (event, context) {
    console.debug(JSON.stringify(event))
    if (event.protocolData == undefined && event.protocolData.mqtt == undefined) {
        console.log('Missing protocol data')
        return buildPolicy(null, false);
    }

    if (event.protocolData.http != undefined) {
        console.log("Begin wss assertion")
        const queryString = event.protocolData.http.queryString
        const params = new URLSearchParams(queryString);
        var queryPassword = params.get('password');
        if (queryPassword != predefinedPassword) {
            console.log("Wrong password")
            return buildPolicy(null, false, false);
        }

        const policy = buildPolicy("user", true, false);
        console.log(JSON.stringify(policy))
        return policy
    }

    console.log("Begin mqtt assertion")
    let username = event.protocolData.mqtt.username;
    const password = Buffer.from(event.protocolData.mqtt.password, 'base64').toString()
    console.debug(`Got [${username}] and [${password}]`)
    if (password === process.env['PASSWORD']) {
        console.log("Building policy")
        const policy = buildPolicy(username, true, false)
        console.debug(JSON.stringify(policy))
        return policy
    } else {
        console.log("No password match")
    }
}


function buildPolicy(username, authenticated) {

    if (!authenticated)
        return {
            isAuthenticated: false,
            principalId: "custom",
            disconnectAfterInSeconds: 0,
            refreshAfterInSeconds: 0,
            context: {},
            policyDocuments: []
        }

    return {
        context: {},
        isAuthenticated: true,
        principalId: `${username.replace(/[^a-zA-Z0-9]/gi, '')}`,
        disconnectAfterInSeconds: 300,
        refreshAfterInSeconds: 300,
        policyDocuments: [
            {
                Version: "2012-10-17",
                Statement: [
                    {
                        "Action": "iot:Connect",
                        "Effect": "Allow",
                        "Resource": [
                            '*'
                        ]
                    },
                    {
                        "Action": "iot:Subscribe",
                        "Effect": "Allow",
                        "Resource": ['*']
                    },
                    {
                        "Action": ["iot:Receive", "iot:Publish"],
                        "Effect": "Allow",
                        "Resource": ['*']
                    }
                ]
            }
        ]
    }
}