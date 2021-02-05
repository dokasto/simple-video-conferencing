/*
 * Signalling server
 */

#include <boost/beast/core.hpp>
#include <boost/asio/strand.hpp>
#include <algorithm>
#include <cstdlib>
#include <iostream>
#include <sstream>
#include <memory>
#include <thread>
#include <vector>
#include "src/Listener.h"

int main() {
    auto raw_port = "8080";
    auto raw_threads = "1";

    auto const port = static_cast<unsigned short>(std::atoi(raw_port));
    auto const threads = std::max<int>(1, std::atoi(raw_threads));

    // The io_context is required for all I/O
    net::io_context ioc{threads};

    // Create and launch a listening port
    std::make_shared<Listener>(ioc, tcp::endpoint(tcp::v4(), port))->run();

    // Run the I/O service on the requested number of threads
    std::vector<std::thread> v;
    v.reserve(threads - 1);
    for(auto i = threads - 1; i > 0; --i)
        v.emplace_back(
                [&ioc]
                {
                    ioc.run();
                });
    ioc.run();

    std::cout << "Websocket server running :)" << std::endl;

    return EXIT_SUCCESS;
}