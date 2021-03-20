cmake_minimum_required(VERSION 3.17)
project(simple_video_conferencing)

set(BOOST_ROOT /usr/local/Cellar/boost/1.75.0_2/include)
set(Boost_LIBRARY_DIR /usr/local/Cellar/boost/1.75.0_2/lib)

find_package(Boost 1.75.0)

include_directories(${Boost_INCLUDE_DIR})
include_directories(${CMAKE_SOURCE_DIR}/lib/websocketpp)

if(NOT Boost_FOUND)
    message(FATAL_ERROR "Could not find boost!")
endif()

set(CMAKE_CXX_STANDARD 20)

include_directories(signalling)

add_executable(simple_video_conferencing signalling/main.cpp)
