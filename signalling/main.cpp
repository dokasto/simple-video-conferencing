#include <set>
#include <map>
#include <websocketpp/config/asio_no_tls.hpp>
#include <websocketpp/server.hpp>
#include <boost/beast/core.hpp>
#include <boost/asio/strand.hpp>
#include <boost/property_tree/ptree.hpp>
#include <iostream>
#include <sstream>
#include <boost/uuid/uuid_io.hpp>
#include <boost/property_tree/json_parser.hpp>
#include <boost/uuid/uuid.hpp>
#include <boost/uuid/random_generator.hpp>

typedef websocketpp::server<websocketpp::config::asio> server;
typedef boost::uuids::uuid connection_id;

using websocketpp::connection_hdl;
using websocketpp::lib::placeholders::_1;
using websocketpp::lib::placeholders::_2;
using websocketpp::lib::bind;
using boost::property_tree::write_json;

using ptree = boost::property_tree::ptree;

std::string EVENT = "event";
std::string PAYLOAD = "payload";
std::string PEER_ID = "peerId";

class Broadcast_server {
private:
    typedef std::map<connection_id, connection_hdl> connections;
    server ws_server;
    connections ws_connections;

public:
    Broadcast_server() {
        ws_server.init_asio();
        ws_server.set_open_handler(bind(&Broadcast_server::on_open, this, ::_1));
        ws_server.set_close_handler(bind(&Broadcast_server::on_close, this, ::_1));
        ws_server.set_message_handler(bind(&Broadcast_server::on_message, this,::_1, ::_2));
        ws_server.set_reuse_addr(true);
    }

    void broadcast_peers_list(connection_id excluded_peer_id) {
        ptree peers;
        ptree response;
        std::ostringstream message_buffer;

        for(auto it=ws_connections.begin(); it != ws_connections.end(); it++) {
            ptree peer;
            peer.put(PEER_ID, it->first);
            peers.push_back(ptree::value_type("", peer));
        }

        response.put(EVENT, "NEW_PEER");
        response.add_child(PAYLOAD, peers);

        std::string json = stringify_ptree(response);

        for(auto it=ws_connections.begin(); it != ws_connections.end(); it++) {
            if (it->first != excluded_peer_id) {
                ws_server.send(it->second, json, websocketpp::frame::opcode::text);
            }
        }
    }

    void broadcast_peer_left(connection_id peerId) {
        ptree response;
        ptree peers;
        peers.put(PEER_ID, peerId);
        response.put(EVENT, "PEER_LEFT");
        response.add_child(PAYLOAD, peers);
        std::string json = stringify_ptree(response);
        broadcast_message(json);
    }

    void broadcast_message(const std::string& message) {
        for(auto it=ws_connections.begin(); it != ws_connections.end(); it++) {
                ws_server.send(it->second, message, websocketpp::frame::opcode::text);
        }
    }

    void broadcast_message(const server::message_ptr& message) {
        for(auto it=ws_connections.begin(); it != ws_connections.end(); it++) {
            ws_server.send(it->second, message);
        }
    }

    void send_connect_message(connection_id& id, const connection_hdl& handler) {
        ptree response;
        ptree payload;
        ptree ice_server;
        ptree ice_servers;

        ice_server.put("urls", "stun:stun.l.google.com:19302");
        ice_servers.push_back(ptree::value_type("", ice_server));
        payload.put(PEER_ID, id);
        payload.add_child("iceServers", ice_servers);
        response.put(EVENT, "CONNECTED");
        response.add_child(PAYLOAD, payload);

        std::string json = stringify_ptree(response);

        ws_server.send(handler, json, websocketpp::frame::opcode::text);
    }

    void run(uint16_t port) {
        ws_server.listen(port);
        ws_server.start_accept();
        ws_server.run();
    }

    void on_open(const connection_hdl& handler) {
        connection_id id = boost::uuids::random_generator()();
        ws_connections.insert(std::make_pair(id, handler));
        send_connect_message(id, handler);
        broadcast_peers_list(id);
    }

    void on_close(const connection_hdl& handler) {
        for(auto it = ws_connections.begin(); it != ws_connections.end(); it++) {
            if (!it->second.owner_before(handler) && !handler.owner_before(it->second)) {
                ws_connections.erase(it);
                broadcast_peer_left(it->first);
                break;
            }
        }
    }

    void on_message(const connection_hdl& handler, const server::message_ptr& message) {
        broadcast_message(message);
    }

    static std::string stringify_ptree(const ptree& tree) {
        std::ostringstream buffer;
        write_json(buffer, tree, false);
        std::string json_string = buffer.str();
        return std::move(json_string);
    }
};

int main() {
    const uint16_t port = 8080;
    Broadcast_server server_instance;
    server_instance.run(port);
}