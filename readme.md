# What
Chat app using IoT Core with custom authorizer

# How to setup
1. Install node and cdk
2. Input the password for auth to IoT Core in secrets.json
3. In /IotCoreChatBackend
`npm i`
`npm run build`
`cdk deploy`
4. Note the url output and input it in App.js
5. In /IotCoreChatFrontend
`npm i`
`npm start`

# Stack
## Backend
The backend is using CDK to provision a lambda authorizer for IoT Core.

## Frontend
The frontend is a react app using aws amplify for wss connection to IoT Core
