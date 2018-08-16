import fetch from 'isomorphic-unfetch'

class Index extends React.Component {

  static async getInitialProps ({ req }) {
    const response = await fetch('http://localhost:3000/list')
    const messages = await response.json()
    return { messages }
  }

  constructor(props) {
    super(props)
    this.state = {
      messages: this.props.messages,
      subscribe: false,
      subscribed: false
    }
  }

  subscribe = () => {
    if (this.state.subscribe && !this.state.subscribed) {
      // connect to WS server and listen event
      this.props.socket.on('message.chat1', this.handleMessage)
      this.setState({ subscribed: true })
    }
  }

  // add messages from server to the state
  handleMessage = (message) => {
    console.log('handleMessage',message)
    this.setState(state => ({ messages: state.messages.concat(message) }))
  }

  componentDidMount () {
    this.subscribe()
  }

  componentDidUpdate () {
    this.subscribe()
  }

  static getDerivedStateFromProps (props, state) {
    if (props.socket && !state.subscribe) return { subscribe: true }
    return null
  }

  // close socket connection
  componentWillUnmount () {
    this.props.socket.off('message.chat1', this.handleMessage)
  }

  render() {
    return (
      <div>
        <ul>
          {this.state.messages.map((item,key) => (
            <li key={key}>{item.name}</li>
          ))}
        </ul>
      </div>
    )
  }
}

export default Index