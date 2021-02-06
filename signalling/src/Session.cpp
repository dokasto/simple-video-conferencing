#include "Session.h"
#include <boost/beast/core.hpp>
#include <boost/beast/websocket.hpp>
#include <boost/asio/dispatch.hpp>
#include <boost/property_tree/ptree.hpp>
#include <boost/property_tree/json_parser.hpp>
#include <boost/uuid/uuid.hpp>
#include <boost/uuid/uuid_generators.hpp>
#include <boost/uuid/uuid_io.hpp>
#include <iostream>
#include <sstream>
#include <memory>
#include <queue>
#include <string>
#include <map>

namespace beast = boost::beast;         // from <boost/beast.hpp>
namespace http = beast::http;           // from <boost/beast/http.hpp>
namespace websocket = beast::websocket; // from <boost/beast/websocket.hpp>
namespace net = boost::asio;            // from <boost/asio.hpp>
using tcp = boost::asio::ip::tcp;       // from <boost/asio/ip/tcp.hpp>
using ptree = boost::property_tree::ptree;
using boost::property_tree::write_json;

const std::string PEER_ID = "peerId";
const std::string EVENT = "event";
const std::string PEER_CONNECTED = "PEER_CONNECTED";
const std::string CONNECTED = "CONNECTED";
const std::string PAYLOAD = "payload";
const std::string ICE_SERVERS = "iceServers";

// Report a failure
void failure(beast::error_code ec, char const* what) {
    std::cerr << what << ": " << ec.message() << "\n";
}

Session::Session(websocket::stream<beast::tcp_stream>& socket,
                 boost::uuids::uuid session_id,
                 std::map<boost::uuids::uuid, websocket::stream<beast::tcp_stream>>& sockets) :
                 ws_(socket), session_id_(session_id), sockets_(sockets) {}

void Session::run() {
    // We need to be executing within a strand to perform async operations
    // on the I/O objects in this session. Although not strictly necessary
    // for single-threaded contexts, this example code is written to be
    // thread-safe by default.
    net::dispatch(ws_.get_executor(),
                  beast::bind_front_handler(
                          &Session::on_run,
                          shared_from_this()));
}

// start the async operation
void Session::on_run() {
    // Set suggested timeout settings for the websocket
    ws_.set_option(
            websocket::stream_base::timeout::suggested(
                    beast::role_type::server));

    // Set a decorator to change the Server of the handshake
    ws_.set_option(websocket::stream_base::decorator(
            [](websocket::response_type& res)
            {
                res.set(http::field::server,
                        std::string(BOOST_BEAST_VERSION_STRING) +
                        " websocket-server-async");
            }));
    // Accept the websocket handshake
    ws_.async_accept(
            beast::bind_front_handler(
                    &Session::on_accept,
                    shared_from_this()));
}

void Session::on_accept(beast::error_code ec) {
    if (ec) {
        return failure(ec, "accept");
    }

    // read a message
    do_read();
    send_hello();
}

void Session::send_hello() {
    ptree response;
    ptree payload;
    ptree ice_server;
    ptree ice_servers;

    ice_server.put("urls", "stun:stun.l.google.com:19302");
    ice_servers.push_back(ptree::value_type("", ice_server));

    payload.put(PEER_ID, session_id_);
    payload.add_child(ICE_SERVERS, ice_servers);

    response.put(EVENT, CONNECTED);
    response.add_child(PAYLOAD, payload);

    std::ostringstream buf;
    write_json(buf, response, false);
    std::string json = buf.str();
    boost::beast::ostream(buffer_) << json;
    ws_.async_write(
            buffer_.data(),
            beast::bind_front_handler(
                    &Session::on_send_message,
                    shared_from_this()));
}

void Session::on_send_message(beast::error_code ec, std::size_t bytes_transferred) {
    boost::ignore_unused(bytes_transferred);
    if (ec) {
        return failure(ec, "write");
    }
    // Clear the buffer
    buffer_.consume(buffer_.size());
    broadcast_new_peer();
}

void Session::broadcast_new_peer() {
    ptree broadcast;
    ptree connected_peers;
    std::ostringstream temp_buf;

    for (auto &peer : sockets_) {
        auto &peer_session = static_cast<websocket::stream<beast::tcp_stream> &>(peer.second);
        session_queue.push(peer_session);
        ptree single_peer;
        single_peer.put(PEER_ID, peer.first);
        connected_peers.push_back(ptree::value_type("", single_peer));
    }

    broadcast.put(EVENT, PEER_CONNECTED);
    broadcast.add_child(PAYLOAD, connected_peers);
    write_json(temp_buf, broadcast, false);
    broadcast_message = temp_buf.str();

    broadcast_helper();
}

// recursively called to broadcast to all connected peers
void Session::broadcast_helper() {
    if (session_queue.empty()) {
        return;
    }

    websocket::stream<beast::tcp_stream> &peer_session = session_queue.front();
    session_queue.pop();
    boost::beast::ostream(broadcast_buffer_) << broadcast_message;
    peer_session.async_write(broadcast_buffer_.data(),
                             beast::bind_front_handler(&Session::on_broadcast_new_peer,
                                                       shared_from_this()));
}

void Session::on_broadcast_new_peer(beast::error_code ec, std::size_t bytes_transferred) {
    boost::ignore_unused(bytes_transferred);
    if (ec) {
        return failure(ec, "write");
    }
    // Clear the buffer
    broadcast_buffer_.consume(broadcast_buffer_.size());
    broadcast_helper();
}

void Session::do_read() {
    // Read a message into our buffer
    ws_.async_read(
            buffer_,
            beast::bind_front_handler(
                    &Session::on_read,
                    shared_from_this()));
}

void Session::on_read(beast::error_code ec, std::size_t bytes_transferred) {
    boost::ignore_unused(bytes_transferred);

    // This indicates that the session was closed
    if (ec == websocket::error::closed) {
        return;
    }

    if (ec) {
        failure(ec, "read");
    }

    // Echo the message
    ws_.text(ws_.got_text());
    ws_.async_write(
            buffer_.data(),
            beast::bind_front_handler(
                    &Session::on_write,
                    shared_from_this()));
}

void Session::on_write(beast::error_code ec, std::size_t bytes_transferred) {
    boost::ignore_unused(bytes_transferred);

    if (ec) {
        return failure(ec, "write");
    }

    // Clear the buffer
    buffer_.consume(buffer_.size());

    // Do another read
    do_read();
}




