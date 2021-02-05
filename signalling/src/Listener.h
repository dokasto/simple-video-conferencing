#ifndef SIMPLE_VIDEO_CONFERENCING_LISTENER_H
#define SIMPLE_VIDEO_CONFERENCING_LISTENER_H

/*
 * Accepts incoming connections and launches the sessions
 */

#include <boost/beast/core.hpp>
#include <boost/asio/strand.hpp>
#include <boost/property_tree/ptree.hpp>
#include <algorithm>
#include <cstdlib>
#include <iostream>
#include <sstream>
#include <memory>
#include <thread>
#include <vector>
#include "src/Session.h"
#include <map>

namespace beast = boost::beast;
namespace http = beast::http;
namespace websocket = beast::websocket;
namespace net = boost::asio;
using tcp = boost::asio::ip::tcp;
using ptree = boost::property_tree::ptree;

class Listener : public std::enable_shared_from_this<Listener> {
private:
    net::io_context& ioc_;
    tcp::acceptor acceptor_;
    std::map<boost::uuids::uuid, websocket::stream<beast::tcp_stream>> sockets;
    void do_accept();
    void on_accept(beast::error_code ec, tcp::socket socket);

public:
    Listener(net::io_context& ioc, tcp::endpoint endpoint);
    void run();
};

#endif //SIMPLE_VIDEO_CONFERENCING_LISTENER_H
