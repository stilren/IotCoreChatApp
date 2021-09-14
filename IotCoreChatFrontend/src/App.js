import React from 'react';
import './App.css';
import Amplify, { PubSub } from 'aws-amplify';
import { MqttOverWSProvider } from "@aws-amplify/pubsub/lib/Providers";

const mqtt_host = 'INPUT YOUR URL'
const mqtt_topic = '#'
const authorizer_name = 'customAuthorizer'

function MessageList(props) {
  const messages = props.messages
  const listItems = messages.map((data, i) =>
    <li key={i}>{JSON.stringify(data)}</li>
  )

  return (
    <ul>{listItems}</ul>
  )
}

export default class App extends React.Component {

  constructor(props) {
    super(props)
    this.updateName = this.updateName.bind(this);
    this.updatePassword = this.updatePassword.bind(this);
    this.updateMessage = this.updateMessage.bind(this);
    this.login = this.login.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.state = {
      messages: [],
      connectionState: 'Initializing Connection...',
      message: "",
      isLoggedIn: false,
      name: "",
      password: ""
    }
  }

  login(e) {
    e.preventDefault()

    Amplify.addPluggable(new MqttOverWSProvider({
      aws_pubsub_endpoint: `wss://${mqtt_host}/mqtt?x-amz-customauthorizer-name=${authorizer_name}&password=password1`,
    }));
    console.log("Log in")
    PubSub.subscribe(mqtt_topic).subscribe({
      next: data => {
        data.value.client_received_at = new Date()
        console.log(`Message received: ${JSON.stringify(data.value)} \nRaw data: ${JSON.stringify(data)}`)

        this.setState(prevState => ({
          connectionState: `Connected and Subscribed to topic '${mqtt_topic}'; Messages Received`,
          messages: [...prevState.messages, data.value]
        }))
      },
      error: error => {
        console.log(JSON.stringify(error, null, 2))
        this.setState(prevState => ({
          connectionState: `Failed to subscribe to topic '${mqtt_topic}' on endpoint ${mqtt_host}: ${error.error.errorMessage}`
        }))
      },
      close: () => {
        this.setState({ connectionState: `Connection Closed` })
      },
    })
    this.setState({ connectionState: `Connected and Subscribed to topic '${mqtt_topic}'; Awaiting Messages...` })
    this.setState({ isLoggedIn: true })
  }

  sendMessage(e) {
    e.preventDefault()
    console.log(this.state)
    PubSub.publish("t/mytopic", { "message": this.state.message, "From": this.state.name })
  }

  updateName(event) {
    this.setState({ name: event.target.value });
  }

  updatePassword(event) {
    this.setState({ password: event.target.value });
  }

  updateMessage(event) {
    this.setState({ message: event.target.value });
  }

  render() {
    const messages = this.state.messages
    const connectionState = this.state.connectionState
    const isLoggedIn = this.state.isLoggedIn
    return (
      <div className="App">
        {!isLoggedIn &&
          <>
            <form onSubmit={this.login}>
              <label>
                Name:
              <input type="text" value={this.state.name} onChange={this.updateName} />
              </label>
              <label>
                Password:
              <input type="text" value={this.state.password} onChange={this.updatePassword} />
              </label>
              <input type="submit" value="Submit" />
            </form>
          </>}
        {isLoggedIn &&
          <>
            <h2>{connectionState}</h2>
            <MessageList messages={messages} />
            <form onSubmit={this.sendMessage}>
              <label>
                Message:
              <input type="text" value={this.state.message} onChange={this.updateMessage} />
              </label>
              <input type="submit" value="Send" />
            </form>
          </>}

      </div>
    )
  }
}
