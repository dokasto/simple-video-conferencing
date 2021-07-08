# Simple Video Conferencing
A simple video conferencing application. Uses Google's STUN server and Mesh architecture.

Feature List
- [x] C++ signalling server
- [x] React/Javascript App client
- [x] Audio mute/unmute
- [x] Video enable/disable
- [x] screen sharing

## Development
### Build and run the signalling server in
- `cd signalling/lib && git clone https://github.com/zaphoyd/websocketpp`
- `cd websocketpp && cmake . && make install`
  
### Build and run the client
- `cd client && yarn install && yarn start`

