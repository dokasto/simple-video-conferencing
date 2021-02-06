#ifndef SIMPLE_VIDEO_CONFERENCING_SESSION_H
#define SIMPLE_VIDEO_CONFERENCING_SESSION_H

#include <boost/beast/core.hpp>
#include <boost/beast/websocket.hpp>
#include <boost/asio/dispatch.hpp>
#include <boost/asio/strand.hpp>
#include <boost/uuid/uuid.hpp>
#include <boost/uuid/uuid_generators.hpp>
#include <boost/uuid/uuid_io.hpp>
#include <algorithm>
#include <cstdlib>
#include <iostream>
#include <sstream>
#include <memory>
#include <string>
#include <thread>
#include <vector>
#include <queue>
#include <map>

namespace beast = boost::beast;
namespace http = beast::http;
namespace websocket = beast::websocket;
namespace net = boost::asio;
using tcp = boost::asio::ip::tcp;

class Session : public std::enable_shared_from_this<Session> {
private:
    websocket::stream<beast::tcp_stream>& ws_;
    beast::flat_buffer buffer_;
    beast::flat_buffer broadcast_buffer_;
    boost::uuids::uuid session_id_;
    std::map<boost::uuids::uuid, websocket::stream<beast::tcp_stream>>& sockets_;
    std::queue<std::reference_wrapper<websocket::stream<beast::tcp_stream>>> session_queue;
    std::string broadcast_message;

public:
    Session(websocket::stream<beast::tcp_stream>& socket, boost::uuids::uuid session_id, std::map<boost::uuids::uuid, websocket::stream<beast::tcp_stream>>& sockets);
    void run();
    void on_run();
    void on_send_message(beast::error_code ec, std::size_t bytes_transferred);
    void on_broadcast_new_peer(beast::error_code ec, std::size_t bytes_transferred);
    void broadcast_helper();
    void broadcast_new_peer();
    void send_hello();
    void on_accept(beast::error_code ec);
    void do_read();
    void on_read(beast::error_code ec, std::size_t bytes_transferred);
    void on_write(beast::error_code ec, std::size_t bytes_transferred);
};

#endif //SIMPLE_VIDEO_CONFERENCING_SESSION_H
